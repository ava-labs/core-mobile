import LedgerService from './LedgerService'
import { LedgerDerivationPathType, AvalancheKey } from './types'

// Mock Logger to prevent console noise
jest.mock('utils/Logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}))

const mockGetAvalancheKeys = jest.fn()
const mockGetSolanaKeys = jest.fn()

const originalGetAvalancheKeys =
  LedgerService.getAvalancheKeys.bind(LedgerService)
const originalGetSolanaKeys = LedgerService.getSolanaKeys.bind(LedgerService)

beforeEach(() => {
  jest.clearAllMocks()
  LedgerService.getAvalancheKeys = mockGetAvalancheKeys
  LedgerService.getSolanaKeys = mockGetSolanaKeys
})

afterEach(() => {
  LedgerService.getAvalancheKeys = originalGetAvalancheKeys
  LedgerService.getSolanaKeys = originalGetSolanaKeys
})

const makeMockAvalancheKey = (index: number): AvalancheKey => ({
  addresses: {
    evm: `0xEVM${index}`,
    avm: `X-avax1avm${index}`,
    pvm: `P-avax1pvm${index}`,
    coreEth: `C-avax1coreeth${index}`,
    btc: `bc1btc${index}`
  },
  xpubs: { evm: `xpub_evm_${index}`, avalanche: `xpub_avax_${index}` },
  publicKeys: [
    {
      key: `evmpk${index}`,
      derivationPath: `m/44'/60'/${index}'/0/0`,
      curve: 'secp256k1' as any
    },
    {
      key: `avaxpk${index}`,
      derivationPath: `m/44'/9000'/${index}'/0/0`,
      curve: 'secp256k1' as any
    }
  ]
})

describe('getAvalancheKeysForRange', () => {
  it('derives keys for each index from 0 to count-1', async () => {
    mockGetAvalancheKeys.mockImplementation(async (index: number) =>
      makeMockAvalancheKey(index)
    )
    const result = await LedgerService.getAvalancheKeysForRange(
      3,
      false,
      LedgerDerivationPathType.BIP44
    )
    expect(mockGetAvalancheKeys).toHaveBeenCalledTimes(3)
    expect(mockGetAvalancheKeys).toHaveBeenCalledWith(
      0,
      false,
      LedgerDerivationPathType.BIP44
    )
    expect(mockGetAvalancheKeys).toHaveBeenCalledWith(
      1,
      false,
      LedgerDerivationPathType.BIP44
    )
    expect(mockGetAvalancheKeys).toHaveBeenCalledWith(
      2,
      false,
      LedgerDerivationPathType.BIP44
    )
    expect(result).toHaveLength(3)
    expect(result[0]?.addresses.evm).toBe('0xEVM0')
    expect(result[2]?.addresses.evm).toBe('0xEVM2')
  })

  it('skips failed indices >0 and returns null for them', async () => {
    mockGetAvalancheKeys
      .mockResolvedValueOnce(makeMockAvalancheKey(0))
      .mockRejectedValueOnce(new Error('Device error'))
      .mockResolvedValueOnce(makeMockAvalancheKey(2))
    const result = await LedgerService.getAvalancheKeysForRange(
      3,
      false,
      LedgerDerivationPathType.BIP44
    )
    expect(result).toHaveLength(3)
    expect(result[0]).not.toBeNull()
    expect(result[1]).toBeNull()
    expect(result[2]).not.toBeNull()
  })

  it('throws if index 0 fails', async () => {
    mockGetAvalancheKeys.mockRejectedValueOnce(new Error('Device error'))
    await expect(
      LedgerService.getAvalancheKeysForRange(
        3,
        false,
        LedgerDerivationPathType.BIP44
      )
    ).rejects.toThrow('Device error')
  })
})

describe('getSolanaKeysForRange', () => {
  it('derives solana keys for each index', async () => {
    mockGetSolanaKeys.mockImplementation(async (index: number) => [
      {
        key: `sol${index}`,
        derivationPath: `44'/501'/${index}'/0/0`,
        curve: 'ed25519' as any
      }
    ])
    const result = await LedgerService.getSolanaKeysForRange(3)
    expect(mockGetSolanaKeys).toHaveBeenCalledTimes(3)
    expect(result).toHaveLength(3)
    expect(result[0]?.[0]?.key).toBe('sol0')
    expect(result[2]?.[0]?.key).toBe('sol2')
  })

  it('derives solana keys starting from a custom startIndex', async () => {
    mockGetSolanaKeys.mockImplementation(async (index: number) => [
      {
        key: `sol${index}`,
        derivationPath: `44'/501'/${index}'/0/0`,
        curve: 'ed25519' as any
      }
    ])
    const result = await LedgerService.getSolanaKeysForRange(2, 3)
    expect(mockGetSolanaKeys).toHaveBeenCalledTimes(2)
    expect(mockGetSolanaKeys).toHaveBeenCalledWith(3, undefined)
    expect(mockGetSolanaKeys).toHaveBeenCalledWith(4, undefined)
    expect(result).toHaveLength(2)
    expect(result[0]?.[0]?.key).toBe('sol3')
    expect(result[1]?.[0]?.key).toBe('sol4')
  })

  it('returns null for failed indices but does not throw', async () => {
    mockGetSolanaKeys
      .mockResolvedValueOnce([
        {
          key: 'sol0',
          derivationPath: "44'/501'/0'/0/0",
          curve: 'ed25519' as any
        }
      ])
      .mockRejectedValueOnce(new Error('Solana app error'))
    const result = await LedgerService.getSolanaKeysForRange(2)
    expect(result).toHaveLength(2)
    expect(result[0]).not.toBeNull()
    expect(result[1]).toBeNull()
  })
})
