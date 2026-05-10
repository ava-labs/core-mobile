import { NetworkVMType } from '@avalabs/vm-module-types'
import { WalletType } from 'services/wallet/types'
import type { GetAddressesResponse } from 'utils/api/generated/profileApi.client/types.gen'
import WalletFactory from './WalletFactory'
import WalletService from './WalletService'

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
  // Use fake timers so we can fast-forward the exponential backoff
  // (250 / 500 / 1000 ms) without making the test slow.
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('retries postV1GetAddresses up to two times on transient HTTP failure', async () => {
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

    // Drive the backoff timers. 250ms after first failure, then 500ms after second.
    await jest.advanceTimersByTimeAsync(250)
    await jest.advanceTimersByTimeAsync(500)

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

    // Run all backoff timers, capturing the rejection.
    // eslint-disable-next-line jest/valid-expect -- awaited below
    const expectation = expect(promise).rejects.toThrow(/profile-api down/)
    await jest.advanceTimersByTimeAsync(250 + 500 + 1000)
    await expectation
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

    // eslint-disable-next-line jest/valid-expect -- awaited below
    const expectation = expect(promise).rejects.toThrow(/unauthorized/)
    await jest.advanceTimersByTimeAsync(0)
    await expectation
    expect(postV1GetAddresses).toHaveBeenCalledTimes(1)
  })
})

import { clearAddressesCache } from './getAddressesCache'

describe('WalletService.getAddresses cache behavior', () => {
  beforeEach(() => {
    clearAddressesCache()
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
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

  it('clearAddressCache forces re-fetch', async () => {
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
    WalletService.clearAddressCache()
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
})
