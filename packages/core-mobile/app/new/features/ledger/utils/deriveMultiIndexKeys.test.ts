import { AvalancheKey, PublicKeyInfo } from 'services/ledger/types'
import { Curve } from 'utils/publicKeys'
import {
  buildFirstAccountKeys,
  deriveBIP44RangeKeys,
  deriveLedgerLiveRangeKeys,
  deriveRangeKeys
} from './deriveMultiIndexKeys'

jest.mock('services/ledger/deriveAddressesOffline', () => ({
  deriveAddressesFromPublicKeys: jest.fn(
    (_evmPk: string, _avaxPk: string, isTestnet: boolean) => ({
      evm: `evm-pk-${isTestnet ? 'test' : 'main'}`,
      avm: `avm-pk-${isTestnet ? 'test' : 'main'}`,
      pvm: `pvm-pk-${isTestnet ? 'test' : 'main'}`,
      coreEth: `coreEth-pk-${isTestnet ? 'test' : 'main'}`,
      btc: `btc-pk-${isTestnet ? 'test' : 'main'}`
    })
  )
}))

jest.mock('./deriveLedgerAddressesFromXpubs', () => ({
  deriveLedgerAddressesFromXpubs: jest.fn(
    async (
      _evmXpub: string,
      _avalancheXpubs: readonly string[],
      accountIndices: readonly number[]
    ) => ({
      mainnet: accountIndices.map(idx => ({
        accountIndex: idx,
        evm: `evm-main-${idx}`,
        avm: `avm-main-${idx}`,
        pvm: `pvm-main-${idx}`,
        coreEth: `coreEth-main-${idx}`,
        btc: `btc-main-${idx}`
      })),
      testnet: accountIndices.map(idx => ({
        accountIndex: idx,
        evm: `evm-test-${idx}`,
        avm: `avm-test-${idx}`,
        pvm: `pvm-test-${idx}`,
        coreEth: `coreEth-test-${idx}`,
        btc: `btc-test-${idx}`
      }))
    })
  )
}))

jest.mock('utils/bip32', () => {
  const mockDerive = (idx: number) => ({
    derive: (idx2: number) => ({
      publicKey: Buffer.from(`pubkey-${idx}-${idx2}`, 'utf8')
    })
  })
  const mockFromBase58 = () => ({ derive: mockDerive })
  const mockFromPublicKey = () => ({ toBase58: () => 'mock-avalanche-xpub' })

  return {
    bip32: {
      fromBase58: jest.fn(mockFromBase58),
      fromPublicKey: jest.fn(mockFromPublicKey)
    },
    derivePublicKey: jest.fn((_xpub: string, ...indices: number[]) =>
      Buffer.from(`pubkey-${indices.join('-')}`, 'utf8')
    ),
    extendedPublicKeyToXpub: jest.fn(
      (_key: string, _chainCode: string) => 'mock-avalanche-xpub'
    )
  }
})

jest.mock('services/ledger/LedgerService', () => ({
  __esModule: true,
  default: {
    getExtendedPublicKeysForRange: jest.fn(),
    getPublicKeysForRange: jest.fn()
  }
}))

const makePk = (key: string, path: string): PublicKeyInfo => ({
  key,
  derivationPath: path,
  curve: Curve.SECP256K1
})

const makeAvalancheKey = (prefix: string): AvalancheKey => ({
  addresses: {
    evm: `${prefix}-evm`,
    avm: `${prefix}-avm`,
    pvm: `${prefix}-pvm`,
    coreEth: `${prefix}-coreEth`,
    btc: `${prefix}-btc`
  },
  xpubs: { evm: 'xpub-evm-0', avalanche: 'xpub-avax-0' },
  publicKeys: [
    makePk(`${prefix}-evmpk`, "m/44'/60'/0'/0/0"),
    makePk(`${prefix}-avaxpk`, "m/44'/9000'/0'/0/0")
  ]
})

describe('buildFirstAccountKeys', () => {
  it('uses deriveLedgerAddressesFromXpubs for BIP44 path', async () => {
    const {
      deriveLedgerAddressesFromXpubs
    } = require('./deriveLedgerAddressesFromXpubs')

    const result = await buildFirstAccountKeys({
      firstAccountKeys: makeAvalancheKey('device'),
      isBIP44: true,
      isDeveloperMode: false,
      startIndex: 0
    })

    expect(deriveLedgerAddressesFromXpubs).toHaveBeenCalledWith(
      'xpub-evm-0',
      ['xpub-avax-0'],
      [0]
    )
    expect(result.mainnet[0]).toBeDefined()
    expect(result.testnet[0]).toBeDefined()
  })

  it('uses deriveAddressesFromPublicKeys for LedgerLive path', async () => {
    const {
      deriveAddressesFromPublicKeys
    } = require('services/ledger/deriveAddressesOffline')

    await buildFirstAccountKeys({
      firstAccountKeys: makeAvalancheKey('device'),
      isBIP44: false,
      isDeveloperMode: false,
      startIndex: 0
    })

    expect(deriveAddressesFromPublicKeys).toHaveBeenCalledWith(
      'device-evmpk',
      'device-avaxpk',
      true
    )
  })

  it('swaps mainnet/testnet when isDeveloperMode is true', async () => {
    const result = await buildFirstAccountKeys({
      firstAccountKeys: makeAvalancheKey('device'),
      isBIP44: true,
      isDeveloperMode: true,
      startIndex: 0
    })

    // In dev mode, the "current" keys (from device) go to testnet
    expect(result.testnet[0]?.avalancheKeys?.addresses.evm).toBe('device-evm')
    // The derived opposite goes to mainnet
    expect(result.mainnet[0]?.avalancheKeys?.addresses.evm).toContain('evm-')
  })

  it('uses the provided startIndex as the key', async () => {
    const result = await buildFirstAccountKeys({
      firstAccountKeys: makeAvalancheKey('device'),
      isBIP44: true,
      isDeveloperMode: false,
      startIndex: 5
    })

    expect(result.mainnet[5]).toBeDefined()
    expect(result.testnet[5]).toBeDefined()
    expect(result.mainnet[0]).toBeUndefined()
  })
})

describe('deriveBIP44RangeKeys', () => {
  it('derives mainnet and testnet keys for each xpub entry', async () => {
    const xpubRange = [
      {
        evm: { path: "m/44'/60'/1'", key: 'evmkey1', chainCode: 'cc1' },
        avalanche: {
          path: "m/44'/9000'/1'",
          key: 'avaxkey1',
          chainCode: 'cc2'
        }
      }
    ]

    const result = await deriveBIP44RangeKeys(xpubRange, 'xpub-evm-account0')

    expect(result.mainnet[1]).toBeDefined()
    expect(result.testnet[1]).toBeDefined()
    expect(result.mainnet[1]?.solanaKeys).toEqual([])
  })

  it('skips null entries in the xpub range', async () => {
    const xpubRange = [
      null,
      {
        evm: { path: "m/44'/60'/2'", key: 'evmkey2', chainCode: 'cc3' },
        avalanche: {
          path: "m/44'/9000'/2'",
          key: 'avaxkey2',
          chainCode: 'cc4'
        }
      }
    ]

    const result = await deriveBIP44RangeKeys(xpubRange, 'xpub-evm-account0')

    expect(result.mainnet[1]).toBeUndefined()
    expect(result.mainnet[2]).toBeDefined()
  })

  it('sets correct derivation paths per account index', async () => {
    const xpubRange = [
      {
        evm: { path: "m/44'/60'/1'", key: 'evmkey1', chainCode: 'cc1' },
        avalanche: {
          path: "m/44'/9000'/1'",
          key: 'avaxkey1',
          chainCode: 'cc2'
        }
      }
    ]

    const result = await deriveBIP44RangeKeys(xpubRange, 'xpub-evm-account0')

    const mainnetKeys = result.mainnet[1]?.avalancheKeys?.publicKeys ?? []
    expect(mainnetKeys[0]?.derivationPath).toBe("m/44'/60'/1'/0/0")
    expect(mainnetKeys[1]?.derivationPath).toBe("m/44'/9000'/1'/0/0")
  })

  it('returns empty maps for empty xpub range', async () => {
    const result = await deriveBIP44RangeKeys([], 'xpub-evm-account0')

    expect(Object.keys(result.mainnet)).toHaveLength(0)
    expect(Object.keys(result.testnet)).toHaveLength(0)
  })
})

describe('deriveLedgerLiveRangeKeys', () => {
  it('derives mainnet and testnet keys for each pubkey entry', () => {
    const pubKeyRange = [
      {
        evmPubKey: 'evm-pk-1',
        avalanchePubKey: 'avax-pk-1',
        evmPath: "m/44'/60'/1'/0/0",
        avalanchePath: "m/44'/9000'/1'/0/0"
      }
    ]

    const result = deriveLedgerLiveRangeKeys(pubKeyRange)

    expect(result.mainnet[1]).toBeDefined()
    expect(result.testnet[1]).toBeDefined()
    expect(result.mainnet[1]?.avalancheKeys?.xpubs).toEqual({
      evm: '',
      avalanche: ''
    })
  })

  it('skips null entries', () => {
    const pubKeyRange = [
      null,
      {
        evmPubKey: 'evm-pk-2',
        avalanchePubKey: 'avax-pk-2',
        evmPath: "m/44'/60'/2'/0/0",
        avalanchePath: "m/44'/9000'/2'/0/0"
      }
    ]

    const result = deriveLedgerLiveRangeKeys(pubKeyRange)

    expect(result.mainnet[1]).toBeUndefined()
    expect(result.mainnet[2]).toBeDefined()
  })

  it('preserves derivation paths from input', () => {
    const pubKeyRange = [
      {
        evmPubKey: 'evm-pk-1',
        avalanchePubKey: 'avax-pk-1',
        evmPath: "m/44'/60'/1'/0/0",
        avalanchePath: "m/44'/9000'/1'/0/0"
      }
    ]

    const result = deriveLedgerLiveRangeKeys(pubKeyRange)

    const pks = result.mainnet[1]?.avalancheKeys?.publicKeys ?? []
    expect(pks[0]?.derivationPath).toBe("m/44'/60'/1'/0/0")
    expect(pks[1]?.derivationPath).toBe("m/44'/9000'/1'/0/0")
  })

  it('returns empty maps for empty range', () => {
    const result = deriveLedgerLiveRangeKeys([])

    expect(Object.keys(result.mainnet)).toHaveLength(0)
    expect(Object.keys(result.testnet)).toHaveLength(0)
  })
})

describe('deriveRangeKeys', () => {
  const LedgerService = require('services/ledger/LedgerService').default

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty maps when count <= 1', async () => {
    const result = await deriveRangeKeys(1, true, 'xpub')

    expect(result.mainnet).toEqual({})
    expect(result.testnet).toEqual({})
    expect(LedgerService.getExtendedPublicKeysForRange).not.toHaveBeenCalled()
    expect(LedgerService.getPublicKeysForRange).not.toHaveBeenCalled()
  })

  it('calls getExtendedPublicKeysForRange for BIP44', async () => {
    LedgerService.getExtendedPublicKeysForRange.mockResolvedValue([])

    await deriveRangeKeys(3, true, 'xpub-evm-0')

    expect(LedgerService.getExtendedPublicKeysForRange).toHaveBeenCalledWith(
      1,
      2
    )
    expect(LedgerService.getPublicKeysForRange).not.toHaveBeenCalled()
  })

  it('calls getPublicKeysForRange for LedgerLive', async () => {
    LedgerService.getPublicKeysForRange.mockResolvedValue([])

    await deriveRangeKeys(3, false, 'xpub-evm-0')

    expect(LedgerService.getPublicKeysForRange).toHaveBeenCalledWith(1, 2)
    expect(LedgerService.getExtendedPublicKeysForRange).not.toHaveBeenCalled()
  })
})
