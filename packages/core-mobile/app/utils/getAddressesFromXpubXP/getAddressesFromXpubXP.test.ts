import { NetworkVMType } from '@avalabs/core-chains-sdk'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { GetAddressesResponse } from '../apiClient/profile/types'
import { getAddressesFromXpubXP } from './getAddressesFromXpubXP'

jest.mock('services/wallet/WalletService')

const mockWalletService = WalletService as jest.Mocked<typeof WalletService>

// Helper to create fake responses
const makeResponse = (
  network: 'AVM' | 'PVM',
  externals: string[],
  internals: string[]
): GetAddressesResponse => ({
  networkType: network,
  externalAddresses: externals.map((addr, index) => ({
    address: addr,
    index,
    hasActivity: true
  })),
  internalAddresses: internals.map((addr, index) => ({
    address: addr,
    index,
    hasActivity: true
  }))
})

describe('getAddressesFromXpubXP', () => {
  beforeEach(() => jest.clearAllMocks())

  const args = {
    isDeveloperMode: false,
    walletId: 'wallet-1',
    walletType: WalletType.MNEMONIC,
    accountIndex: 0,
    onlyWithActivity: true
  }

  it('merges, dedupes, and sorts AVM + PVM XP addresses (base case)', async () => {
    const avm = makeResponse('AVM', ['X-avax1aaa', 'X-avax1bbb'], [])
    const pvm = makeResponse('PVM', ['P-avax1aaa', 'P-avax1bbb'], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual(['avax1aaa', 'avax1bbb'])
    expect(result.xpAddressDictionary).toMatchObject({
      avax1aaa: { space: 'e', index: 0, hasActivity: true },
      avax1bbb: { space: 'e', index: 1, hasActivity: true }
    })
  })

  it('handles internal addresses correctly', async () => {
    const avm = makeResponse('AVM', ['X-avax1aaa'], ['X-avax1ccc'])
    const pvm = makeResponse('PVM', ['P-avax1bbb'], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual(['avax1aaa', 'avax1bbb', 'avax1ccc'])
  })

  it('dedupes even if AVM and PVM have different index values for the same address', async () => {
    const avm = makeResponse('AVM', ['X-avax1zzz'], [])
    const pvm = makeResponse('PVM', ['P-avax1zzz'], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual(['avax1zzz']) // only one
  })

  it('handles situations where AVM returns empty and PVM has addresses', async () => {
    const avm = makeResponse('AVM', [], [])
    const pvm = makeResponse('PVM', ['P-avax1foo', 'P-avax1bar'], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual(['avax1bar', 'avax1foo'])
  })

  it('removes duplicates even if AVM returns the same address multiple times', async () => {
    const avm = makeResponse('AVM', ['X-avax1dup', 'X-avax1dup'], [])
    const pvm = makeResponse('PVM', [], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual(['avax1dup'])
  })

  it('sorts lexicographically regardless of input order', async () => {
    const avm = makeResponse('AVM', ['X-avax1zzz', 'X-avax1aaa'], [])
    const pvm = makeResponse('PVM', ['P-avax1mmm'], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual(['avax1aaa', 'avax1mmm', 'avax1zzz'])
  })
})
