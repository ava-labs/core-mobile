import { NetworkVMType } from '@avalabs/vm-module-types'
import { WalletType } from 'services/wallet/types'
import type { GetAddressesResponse } from 'utils/api/generated/profileApi.client/types.gen'
import { Curve } from 'utils/publicKeys'
import { isUnsupportedXpDerivationError } from 'services/wallet/KeystoneWallet/errors'
import WalletFactory from './WalletFactory'
import WalletService from './WalletService'
import { clearAddressesCache } from './getAddressesCache'

const avmWithActivityResponse: GetAddressesResponse = {
  networkType: 'AVM',
  externalAddresses: [{ address: 'X-avax1', index: 0, hasActivity: true }],
  internalAddresses: []
}

const pvmEmptyResponse: GetAddressesResponse = {
  networkType: 'PVM',
  externalAddresses: [],
  internalAddresses: []
}

// Module-level mocks below exist purely to satisfy WalletService's import
// graph during test loading. The actual XP-activity behavior is exercised
// via a direct spy on `getAddressesForExtendedPublicKey` (see below) so
// that the postV1GetAddresses + unwrap + validation path is never run by
// these tests. That path was the source of a long-standing CI flake
// ("Failed to get addresses from postV1GetAddresses") whenever mock-
// implementation timing or fall-through left the body undefined.
jest.mock('utils/api/generated/profileApi.client', () => ({
  __esModule: true,
  postV1GetAddresses: jest.fn()
}))

jest.mock('utils/api/clients/profileApiClient', () => ({
  profileApiClient: {}
}))

jest.mock('utils/caip2ChainIds', () => ({
  applyTempChainIdConversion: jest.fn((id: number) => id)
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock('features/keystone/storage/KeystoneDataStorage', () => ({
  KeystoneDataStorage: { retrieve: jest.fn() }
}))

// `getAddressesForExtendedPublicKey` is a private method, but TS `private`
// is compile-time only — Jest can spy on it at runtime. We strip the
// original (private-bearing) type via `unknown as` so the public-shape
// overlay below doesn't conflict with the private declaration, and so
// `jest.spyOn` can correctly infer the implementation signature.
const walletServiceInternal = WalletService as unknown as {
  getAddressesForExtendedPublicKey: (opts: {
    extendedPublicKey: string
    networkType: NetworkVMType.AVM | NetworkVMType.PVM
    isTestnet: boolean
    onlyWithActivity: boolean
  }) => Promise<GetAddressesResponse>
}

describe('WalletService.hasActivityFromXpubXP', () => {
  beforeEach(() => {
    WalletFactory.cache.clearWallet('wallet-1')
  })

  afterEach(() => {
    // Restores both spies (`getRawXpubXP`, `getAddressesForExtendedPublicKey`)
    // back to their originals. Module-level `jest.fn()` mocks are not affected
    // — see Jest docs on `restoreAllMocks` (only spies are restored).
    jest.restoreAllMocks()
  })

  it('reuses one XP xpub for AVM and PVM activity lookups', async () => {
    const getRawXpubXPSpy = jest
      .spyOn(WalletService, 'getRawXpubXP')
      .mockResolvedValue('xpub-123')

    const getAddressesSpy = jest
      .spyOn(walletServiceInternal, 'getAddressesForExtendedPublicKey')
      .mockImplementation(async ({ networkType }) => {
        if (networkType === NetworkVMType.AVM) {
          return avmWithActivityResponse
        }
        return pvmEmptyResponse
      })

    const hasActivity = await WalletService.hasActivityFromXpubXP({
      walletId: 'wallet-1',
      walletType: WalletType.MNEMONIC,
      accountIndex: 2,
      isTestnet: false
    })

    expect(hasActivity).toBe(true)
    expect(getRawXpubXPSpy).toHaveBeenCalledTimes(1)
    expect(getAddressesSpy).toHaveBeenCalledTimes(2)
    expect(getAddressesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        extendedPublicKey: 'xpub-123',
        networkType: NetworkVMType.AVM,
        onlyWithActivity: true
      })
    )
    expect(getAddressesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        extendedPublicKey: 'xpub-123',
        networkType: NetworkVMType.PVM,
        onlyWithActivity: true
      })
    )
  })

  it('skips non-primary Keystone accounts until per-account XP xpubs are supported', async () => {
    const getRawXpubXPSpy = jest.spyOn(WalletService, 'getRawXpubXP')
    const getAddressesSpy = jest.spyOn(
      walletServiceInternal,
      'getAddressesForExtendedPublicKey'
    )

    const hasActivity = await WalletService.hasActivityFromXpubXP({
      walletId: 'wallet-1',
      walletType: WalletType.KEYSTONE,
      accountIndex: 1,
      isTestnet: false
    })

    expect(hasActivity).toBe(false)
    expect(getRawXpubXPSpy).not.toHaveBeenCalled()
    expect(getAddressesSpy).not.toHaveBeenCalled()
  })

  it('returns as soon as one XP network reports activity', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-123')

    // PVM is intentionally a never-resolving promise: if `hasActivityFromXpubXP`
    // were to await PVM, this test would hang forever (no real timer / deferred
    // resolution dance needed). Resolving via AVM only proves the early-exit
    // behavior of `raceAnyTrueOrThrow` deterministically.
    jest
      .spyOn(walletServiceInternal, 'getAddressesForExtendedPublicKey')
      .mockImplementation(({ networkType }) => {
        if (networkType === NetworkVMType.AVM) {
          return Promise.resolve(avmWithActivityResponse)
        }
        return new Promise<GetAddressesResponse>(() => {
          /* never resolves */
        })
      })

    await expect(
      WalletService.hasActivityFromXpubXP({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accountIndex: 2,
        isTestnet: false
      })
    ).resolves.toBe(true)
  })
})

describe('WalletService.getAddresses retry behavior', () => {
  // Each test owns its own postV1GetAddresses mock impl. We force a hard
  // reset so a closure-captured `calls` counter or hanging promise from a
  // prior test cannot bleed into the next one — that bleed is what makes
  // these tests appear to "time out" or surface a TypeError on slow CI.
  beforeEach(() => {
    clearAddressesCache()
    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )
    postV1GetAddresses.mockReset()
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('retries postV1GetAddresses up to three times on transient HTTP failure', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-retry')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    let calls = 0
    postV1GetAddresses.mockImplementation(async () => {
      calls += 1
      if (calls < 3) {
        // Mimic hey-api shape on a 5xx response: parsed body with error field.
        return { data: undefined, error: { status: 503, message: 'upstream' } }
      }
      return { data: avmWithActivityResponse }
    })

    const promise = WalletService.getAddressesFromXpubXP({
      walletId: 'wallet-retry',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM,
      isTestnet: false,
      onlyWithActivity: false
    })

    // Drain all queued backoff timers + microtasks until the promise settles.
    // `runAllTimersAsync` is more robust on slow CI than `advanceTimersByTimeAsync`
    // with hand-tuned values, which can drop interleaved microtasks.
    await jest.runAllTimersAsync()

    const result = await promise
    expect(result).toEqual(avmWithActivityResponse)
    expect(calls).toBe(3)
  })

  it('preserves upstream error message when retries are exhausted', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-exhaust')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    postV1GetAddresses.mockImplementation(async () => ({
      data: undefined,
      error: { status: 503, message: 'profile-api down' }
    }))

    const promise = WalletService.getAddressesFromXpubXP({
      walletId: 'wallet-exhaust',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM,
      isTestnet: false,
      onlyWithActivity: false
    })

    // Catch the rejection ourselves so an unhandled-rejection warning can't
    // race the assertion. Then drain all retries.
    const settled = promise.catch(err => err)
    await jest.runAllTimersAsync()
    const err = await settled
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toMatch(/profile-api down/)
  })

  it('does NOT retry on non-transient (4xx) error', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-4xx')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    postV1GetAddresses.mockImplementation(async () => ({
      data: undefined,
      error: { status: 401, message: 'unauthorized' }
    }))

    const promise = WalletService.getAddressesFromXpubXP({
      walletId: 'wallet-4xx',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM,
      isTestnet: false,
      onlyWithActivity: false
    })

    const settled = promise.catch(err => err)
    await jest.runAllTimersAsync()
    const err = await settled
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toMatch(/unauthorized/)
    expect(postV1GetAddresses).toHaveBeenCalledTimes(1)
  })

  it('does NOT retry on unrecognized body shape (deterministic validation error)', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-shape')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    // Successful HTTP response but body fails the schema check —
    // retrying won't recover, so the helper must give up immediately.
    postV1GetAddresses.mockResolvedValue({
      data: { not: 'a valid GetAddressesResponse' }
    })

    const promise = WalletService.getAddressesFromXpubXP({
      walletId: 'wallet-shape',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM,
      isTestnet: false,
      onlyWithActivity: false
    })

    const settled = promise.catch(err => err)
    await jest.runAllTimersAsync()
    const err = await settled
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toMatch(/unrecognized body shape/)
    expect(postV1GetAddresses).toHaveBeenCalledTimes(1)
  })
})

describe('WalletService.getAddresses cache behavior', () => {
  // No fake timers in this block — none of these tests exercise the
  // backoff, and fake timers add microtask-flush brittleness on slow CI.
  beforeEach(() => {
    clearAddressesCache()
    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )
    postV1GetAddresses.mockReset()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the cached value on the second call without re-calling postV1GetAddresses', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-cache')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    postV1GetAddresses.mockResolvedValue({ data: avmWithActivityResponse })

    const args = {
      walletId: 'wallet-cache',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM as const,
      isTestnet: false,
      onlyWithActivity: false
    }

    const first = await WalletService.getAddressesFromXpubXP(args)
    const second = await WalletService.getAddressesFromXpubXP(args)

    expect(first).toEqual(avmWithActivityResponse)
    expect(second).toEqual(avmWithActivityResponse)
    // getRawXpubXP is called both times (cheap), but the API is hit only once.
    expect(postV1GetAddresses).toHaveBeenCalledTimes(1)
  })

  it('clearAddressesCache forces re-fetch', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-clear')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    postV1GetAddresses.mockResolvedValue({ data: avmWithActivityResponse })

    const args = {
      walletId: 'wallet-clear',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM as const,
      isTestnet: false,
      onlyWithActivity: false
    }

    await WalletService.getAddressesFromXpubXP(args)
    clearAddressesCache()
    await WalletService.getAddressesFromXpubXP(args)

    expect(postV1GetAddresses).toHaveBeenCalledTimes(2)
  })

  it('does NOT cache failed responses', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-fail')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    let calls = 0
    postV1GetAddresses.mockImplementation(async () => {
      calls += 1
      if (calls === 1)
        return { data: undefined, error: { status: 401, message: 'auth' } }
      return { data: avmWithActivityResponse }
    })

    const args = {
      walletId: 'wallet-fail',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM as const,
      isTestnet: false,
      onlyWithActivity: false
    }

    await expect(WalletService.getAddressesFromXpubXP(args)).rejects.toThrow(
      /auth/
    )
    await expect(WalletService.getAddressesFromXpubXP(args)).resolves.toEqual(
      avmWithActivityResponse
    )

    expect(calls).toBe(2)
  })

  it('de-dups concurrent calls with the same key — only one API call fires', async () => {
    jest
      .spyOn(WalletService, 'getRawXpubXP')
      .mockResolvedValue('xpub-concurrent')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    // Hold the API mock unresolved until we have both callers in flight.
    let resolveApi: (value: { data: GetAddressesResponse }) => void = () => {
      /* set below */
    }
    postV1GetAddresses.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveApi = resolve
        })
    )

    const args = {
      walletId: 'wallet-concurrent',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM as const,
      isTestnet: false,
      onlyWithActivity: false
    }

    const first = WalletService.getAddressesFromXpubXP(args)
    const second = WalletService.getAddressesFromXpubXP(args)

    // Flush microtasks so both callers reach the in-flight registration
    // (each first awaits the mocked getRawXpubXP before hitting the cache).
    await Promise.resolve()
    await Promise.resolve()

    // Both callers are in flight; only one API call should have fired.
    expect(postV1GetAddresses).toHaveBeenCalledTimes(1)

    // Resolve the single API call and confirm both promises receive the value.
    resolveApi({ data: avmWithActivityResponse })

    const [a, b] = await Promise.all([first, second])
    expect(a).toEqual(avmWithActivityResponse)
    expect(b).toEqual(avmWithActivityResponse)
    expect(postV1GetAddresses).toHaveBeenCalledTimes(1)
  })

  it('does NOT populate the cache if clearAddressesCache fires mid-fetch', async () => {
    jest.spyOn(WalletService, 'getRawXpubXP').mockResolvedValue('xpub-race')

    const { postV1GetAddresses } = jest.requireMock(
      'utils/api/generated/profileApi.client'
    )

    // Hold the API resolution until we release it manually, so we can clear
    // the cache while the retry promise is still in flight.
    let resolveApi: (value: { data: GetAddressesResponse }) => void = () => {
      /* set below */
    }
    postV1GetAddresses.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveApi = resolve
        })
    )

    const args = {
      walletId: 'wallet-race',
      walletType: WalletType.MNEMONIC,
      accountIndex: 0,
      networkType: NetworkVMType.AVM as const,
      isTestnet: false,
      onlyWithActivity: false
    }

    const fetchInFlight = WalletService.getAddressesFromXpubXP(args)

    // Let both `getRawXpubXP` and the in-flight registration settle, then
    // simulate an app-lock by clearing the cache while the API is mid-flight.
    await Promise.resolve()
    await Promise.resolve()
    clearAddressesCache()

    // Resolve the in-flight API call. Its body should NOT be cached because
    // the epoch advanced between fetch-start and fetch-resolve.
    resolveApi({ data: avmWithActivityResponse })
    const result = await fetchInFlight
    expect(result).toEqual(avmWithActivityResponse)

    // Subsequent call should hit the API again, not return a stale cache hit.
    let secondCallFired = false
    postV1GetAddresses.mockImplementation(async () => {
      secondCallFired = true
      return { data: avmWithActivityResponse }
    })

    await WalletService.getAddressesFromXpubXP(args)
    expect(secondCallFired).toBe(true)
  })
})

describe('WalletService.getRawXpubXP (Keystone read path)', () => {
  beforeEach(() => {
    WalletFactory.cache.clearWallet('keystone-wallet-1')
    WalletFactory.cache.clearWallet('keystone-wallet-2')
    jest.clearAllMocks()
  })

  // CP-14995 blocks WalletFactory from ever constructing a KeystoneWallet
  // (all Keystone signing is unsupported now), so this read path must reach
  // the stored xpub directly from KeystoneDataStorage rather than going
  // through WalletFactory — that's what keeps existing Keystone wallets'
  // X/P addresses/balances readable.
  it('reads the stored xpub directly from KeystoneDataStorage without constructing a Wallet', async () => {
    const { KeystoneDataStorage } = jest.requireMock(
      'features/keystone/storage/KeystoneDataStorage'
    )
    KeystoneDataStorage.retrieve.mockResolvedValue({
      evm: 'xpub-evm',
      xp: 'xpub-xp-value',
      mfp: 'deadbeef'
    })
    const getOrCreateSpy = jest.spyOn(WalletFactory, 'getOrCreateWallet')

    const xpub = await WalletService.getRawXpubXP({
      walletId: 'keystone-wallet-1',
      walletType: WalletType.KEYSTONE,
      accountIndex: 0
    })

    expect(xpub).toBe('xpub-xp-value')
    expect(getOrCreateSpy).not.toHaveBeenCalled()
  })

  it('throws when the stored Keystone data has no X/P xpub', async () => {
    const { KeystoneDataStorage } = jest.requireMock(
      'features/keystone/storage/KeystoneDataStorage'
    )
    KeystoneDataStorage.retrieve.mockResolvedValue({
      evm: 'xpub-evm',
      mfp: 'deadbeef'
    })

    await expect(
      WalletService.getRawXpubXP({
        walletId: 'keystone-wallet-2',
        walletType: WalletType.KEYSTONE,
        accountIndex: 0
      })
    ).rejects.toThrow('no public key (xpubXP) available')
  })
})

describe('WalletService.getPublicKeyFor (Keystone read path)', () => {
  // Same fixture + expected pubkeys as the deleted KeystoneWallet.test.ts
  // (verified there against the real getAddressPublicKeyFromXPub /
  // Avalanche.getAddressPublicKeyFromXpub implementations, which this read
  // path calls directly — see CP-14995 fix-report for the reachable chain
  // this guards: dev-mode toggle -> ModuleManager.deriveKeystoneAddresses ->
  // ApprovalController.requestPublicKey -> WalletService.getPublicKeyFor).
  const MockedKeystoneData = {
    evm: 'xpub661MyMwAqRbcGSmFWVZk2h773zMrcPFqDUWi7cFRpgPhfn7y9HEPzPsBDEXYxAWfAoGo7E7ijjYfB3xAY86MYzfvGLDHmcy2epZKNeDd4uQ',
    xp: 'xpub661MyMwAqRbcFFDMuFiGQmA1EqWxxgDLdtNvxxiucf9qkfoVrvwgnYyshxWoewWtkZ1aLhKoVDrpeDvn1YRqxX2szhGKi3UiSEv1hYRMF8q',
    mfp: '1250b6bc'
  }

  beforeEach(() => {
    WalletFactory.cache.clearWallet('keystone-wallet-pubkey')
    jest.clearAllMocks()
    const { KeystoneDataStorage } = jest.requireMock(
      'features/keystone/storage/KeystoneDataStorage'
    )
    KeystoneDataStorage.retrieve.mockResolvedValue(MockedKeystoneData)
  })

  it('derives the EVM public key from the stored evm xpub without constructing a Wallet', async () => {
    const getOrCreateSpy = jest.spyOn(WalletFactory, 'getOrCreateWallet')

    const publicKey = await WalletService.getPublicKeyFor({
      walletId: 'keystone-wallet-pubkey',
      walletType: WalletType.KEYSTONE,
      derivationPath: `m/44'/60'/0'/0/1`,
      curve: Curve.SECP256K1
    })

    expect(publicKey).toBe(
      '0341f20093c553b2aa95dd57449532b85480de93a9aaa225a391dcfe8679e33f50'
    )
    expect(getOrCreateSpy).not.toHaveBeenCalled()
  })

  it('derives the primary-account X/P public key from the stored xp xpub', async () => {
    const publicKey = await WalletService.getPublicKeyFor({
      walletId: 'keystone-wallet-pubkey',
      walletType: WalletType.KEYSTONE,
      derivationPath: `m/44'/9000'/0'/0/1`,
      curve: Curve.SECP256K1
    })

    expect(publicKey).toBe(
      '034814b89f62338b37881a71ffe40cdd29752241560b861a7086ac711fa7a8fe79'
    )
  })

  it('throws an error matching isUnsupportedXpDerivationError for a non-primary X/P path', async () => {
    expect.assertions(1)
    try {
      await WalletService.getPublicKeyFor({
        walletId: 'keystone-wallet-pubkey',
        walletType: WalletType.KEYSTONE,
        derivationPath: `m/44'/9000'/1'/0/0`,
        curve: Curve.SECP256K1
      })
    } catch (error) {
      expect(isUnsupportedXpDerivationError(error)).toBe(true)
    }
  })
})
