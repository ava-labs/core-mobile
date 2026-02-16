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
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock hasXpub to return true for MNEMONIC wallet type
    mockWalletService.hasXpub.mockReturnValue(true)
  })

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

    expect(result.xpAddresses).toEqual([
      { address: 'avax1aaa', index: 0 },
      { address: 'avax1bbb', index: 1 }
    ])
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

    expect(result.xpAddresses).toEqual([
      { address: 'avax1aaa', index: 0 },
      { address: 'avax1bbb', index: 0 },
      { address: 'avax1ccc', index: 0 }
    ])
  })

  it('dedupes even if AVM and PVM have different index values for the same address', async () => {
    const avm = makeResponse('AVM', ['X-avax1zzz'], [])
    const pvm = makeResponse('PVM', ['P-avax1zzz'], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual([{ address: 'avax1zzz', index: 0 }]) // only one
  })

  it('handles situations where AVM returns empty and PVM has addresses', async () => {
    const avm = makeResponse('AVM', [], [])
    const pvm = makeResponse('PVM', ['P-avax1foo', 'P-avax1bar'], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual([
      { address: 'avax1foo', index: 0 },
      { address: 'avax1bar', index: 1 }
    ])
  })

  it('removes duplicates even if AVM returns the same address multiple times', async () => {
    const avm = makeResponse('AVM', ['X-avax1dup', 'X-avax1dup'], [])
    const pvm = makeResponse('PVM', [], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual([{ address: 'avax1dup', index: 1 }])
  })

  it('sorts by index, then lexicographically for same index', async () => {
    const avm = makeResponse('AVM', ['X-avax1zzz', 'X-avax1aaa'], [])
    const pvm = makeResponse('PVM', ['P-avax1mmm'], [])

    mockWalletService.getAddressesFromXpubXP.mockImplementation(
      async ({ networkType }) => (networkType === NetworkVMType.AVM ? avm : pvm)
    )

    const result = await getAddressesFromXpubXP(args)

    expect(result.xpAddresses).toEqual([
      { address: 'avax1mmm', index: 0 },
      { address: 'avax1zzz', index: 0 },
      { address: 'avax1aaa', index: 1 }
    ])
  })

  describe('Keystone wallet XP address ownership', () => {
    const keystoneArgs = {
      isDeveloperMode: false,
      walletId: 'keystone-wallet-1',
      walletType: WalletType.KEYSTONE,
      accountIndex: 0,
      onlyWithActivity: true
    }

    it('returns all addresses for Keystone primary account (index 0)', async () => {
      const avm = makeResponse(
        'AVM',
        ['X-avax1aaa', 'X-avax1bbb', 'X-avax1ccc'],
        []
      )
      const pvm = makeResponse(
        'PVM',
        ['P-avax1aaa', 'P-avax1bbb', 'P-avax1ccc'],
        []
      )

      mockWalletService.getAddressesFromXpubXP.mockImplementation(
        async ({ networkType }) =>
          networkType === NetworkVMType.AVM ? avm : pvm
      )

      const result = await getAddressesFromXpubXP(keystoneArgs)

      // Account 0 should see ALL addresses under the shared xpub
      expect(result.xpAddresses).toEqual([
        { address: 'avax1aaa', index: 0 },
        { address: 'avax1bbb', index: 1 },
        { address: 'avax1ccc', index: 2 }
      ])
    })

    it('returns empty for Keystone non-primary account (index 1)', async () => {
      const result = await getAddressesFromXpubXP({
        ...keystoneArgs,
        accountIndex: 1
      })

      expect(result.xpAddresses).toEqual([])
      expect(Object.keys(result.xpAddressDictionary)).toHaveLength(0)
      // Should NOT call the Profile API at all
      expect(mockWalletService.getAddressesFromXpubXP).not.toHaveBeenCalled()
    })

    it('returns empty for Keystone non-primary account (index 4)', async () => {
      const result = await getAddressesFromXpubXP({
        ...keystoneArgs,
        accountIndex: 4
      })

      expect(result.xpAddresses).toEqual([])
      expect(Object.keys(result.xpAddressDictionary)).toHaveLength(0)
      expect(mockWalletService.getAddressesFromXpubXP).not.toHaveBeenCalled()
    })

    it('does not affect mnemonic wallets with non-zero account index', async () => {
      const avm = makeResponse(
        'AVM',
        ['X-avax1aaa', 'X-avax1bbb'],
        []
      )
      const pvm = makeResponse('PVM', [], [])

      mockWalletService.getAddressesFromXpubXP.mockImplementation(
        async ({ networkType }) =>
          networkType === NetworkVMType.AVM ? avm : pvm
      )

      const result = await getAddressesFromXpubXP({
        ...args,
        accountIndex: 2
      })

      // Mnemonic wallets should still return all addresses regardless of index
      expect(result.xpAddresses).toHaveLength(2)
      expect(mockWalletService.getAddressesFromXpubXP).toHaveBeenCalled()
    })
  })
})
