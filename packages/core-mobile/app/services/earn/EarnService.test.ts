import testValidators from 'tests/fixtures/pvm/validators.json'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { CoreAccountType } from '@avalabs/types'
import { Hour, MainnetParams } from 'utils/NetworkParams'
import { Seconds } from 'types/siUnits'
import { WalletType } from 'services/wallet/types'
import { Account } from 'store/account/types'
import { zeroAvaxPChain } from 'utils/units/zeroValues'
import EarnService from './EarnService'

const mockGetAddressesFromXpubXP = jest.fn()

jest.mock('utils/getAddressesFromXpubXP', () => ({
  getAddressesFromXpubXP: mockGetAddressesFromXpubXP
}))

jest.mock('utils/runAfterInteractions', () => ({
  runAfterInteractions: jest.fn((callback: () => Promise<unknown>) =>
    callback()
  )
}))

const mockProvider = {
  getApiP: () => {
    return {
      getCurrentValidators: jest.fn().mockResolvedValue(testValidators)
    }
  }
}

const mockAccount: Account = {
  id: 'account-1',
  index: 0,
  name: 'Test Account',
  type: CoreAccountType.PRIMARY,
  walletId: 'wallet-1',
  addressC: '0x123',
  addressBTC: 'btc123',
  addressAVM: 'X-avax123',
  addressPVM: 'P-avax123',
  addressCoreEth: '0x456',
  addressSVM: 'svm123',
  xpAddressDictionary: {},
  xpAddresses: undefined,
  hasMigratedXpAddresses: false
}

const mockAccount2: Account = {
  id: 'account-2',
  index: 1,
  name: 'Test Account 2',
  type: CoreAccountType.PRIMARY,
  walletId: 'wallet-1',
  addressC: '0x789',
  addressBTC: 'btc789',
  addressAVM: 'X-avax789',
  addressPVM: 'P-avax789',
  addressCoreEth: '0xabc',
  addressSVM: 'svm789',
  xpAddressDictionary: {},
  xpAddresses: undefined,
  hasMigratedXpAddresses: false
}

describe('EarnService', () => {
  describe('getCurrentValidators', () => {
    it('should return valid validators', async () => {
      const validators = await EarnService.getCurrentValidators(
        mockProvider as unknown as Avalanche.JsonRpcProvider
      )
      expect(validators).toEqual(testValidators)
    })
  })
  describe('calcReward', () => {
    it('should return zero if current supply is max', () => {
      expect(
        EarnService.calcReward(
          BigInt(25 * 10 ** 9),
          Seconds(7 * 24 * Hour),
          new TokenUnit(
            MainnetParams.stakingConfig.RewardConfig.SupplyCap,
            9,
            'AVAX'
          ),
          2,
          true
        )
      ).toEqual(zeroAvaxPChain())
    })
    it('should return non zero if current supply is less than max', () => {
      expect(
        EarnService.calcReward(
          BigInt(2000000 * 10 ** 9),
          Seconds(7 * 24 * Hour),
          new TokenUnit(400_000_000 * 10 ** 9, 9, 'AVAX'),
          2,
          true
        ).toDisplay()
      ).toEqual('3,018.66')
    })
  })

  describe('getTransformedStakesForAllAccounts', () => {
    let mockGetAllStakes: jest.SpyInstance

    beforeEach(() => {
      jest.clearAllMocks()
      mockGetAllStakes = jest.spyOn(EarnService, 'getAllStakes')
    })

    afterEach(() => {
      mockGetAllStakes.mockRestore()
    })

    it('should return transformed stakes when getAddressesFromXpubXP returns addresses', async () => {
      // Mock for both current network (isTestnet=false) and opposite network (isTestnet=true)
      mockGetAddressesFromXpubXP.mockResolvedValue({
        xpAddresses: [
          { address: 'P-avax123', index: 0 },
          { address: 'P-avax456', index: 1 }
        ]
      })

      // Mock getAllStakes to return a stake
      mockGetAllStakes.mockResolvedValue([
        {
          txHash: 'tx123',
          endTimestamp: 1234567890,
          emittedUtxos: [
            {
              staked: true,
              addresses: ['avax123']
            }
          ]
        }
      ])

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount],
        isTestnet: false
      })

      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({
        txHash: 'tx123',
        endTimestamp: 1234567890,
        accountId: 'account-1',
        isDeveloperMode: false
      })
    })

    it('should fallback to addressPVM when getAddressesFromXpubXP returns empty for current network', async () => {
      // Return empty for both networks
      mockGetAddressesFromXpubXP.mockResolvedValue({
        xpAddresses: []
      })

      // Mock getAllStakes to return a stake
      mockGetAllStakes.mockResolvedValue([
        {
          txHash: 'tx456',
          endTimestamp: 9876543210,
          emittedUtxos: [
            {
              staked: true,
              addresses: ['avax123']
            }
          ]
        }
      ])

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount],
        isTestnet: false
      })

      // Verify getAllStakes was called with fallback addressPVM
      expect(mockGetAllStakes).toHaveBeenCalledWith(
        expect.objectContaining({
          isTestnet: false,
          addresses: ['avax123']
        })
      )
      expect(result).toHaveLength(1)
    })

    it('should handle getAddressesFromXpubXP throwing error for current network', async () => {
      mockGetAddressesFromXpubXP.mockImplementation(({ isDeveloperMode }) => {
        if (isDeveloperMode === false) {
          // Current network throws
          throw new Error('Network error')
        }
        // Opposite network succeeds
        return Promise.resolve({
          xpAddresses: [{ address: 'P-fuji789', index: 0 }]
        })
      })

      mockGetAllStakes.mockResolvedValue([
        {
          txHash: 'tx-stake',
          endTimestamp: 1111111111,
          emittedUtxos: [
            {
              staked: true,
              addresses: ['avax123']
            }
          ]
        }
      ])

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount],
        isTestnet: false
      })

      // Should return stakes despite error - falls back to addressPVM
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return stakes when getAddressesFromXpubXP throws for opposite network', async () => {
      mockGetAddressesFromXpubXP.mockImplementation(({ isDeveloperMode }) => {
        if (isDeveloperMode === true) {
          // Opposite network throws
          throw new Error('Network error')
        }
        // Current network succeeds
        return Promise.resolve({
          xpAddresses: [{ address: 'avax123', index: 0 }]
        })
      })

      // Only mock current network since opposite returns empty addresses and won't call getAllStakes
      mockGetAllStakes.mockResolvedValue([
        {
          txHash: 'tx-current',
          endTimestamp: 2222222222,
          emittedUtxos: [
            {
              staked: true,
              addresses: ['avax123']
            }
          ]
        }
      ])

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount],
        isTestnet: false
      })

      // Should get addresses from current network
      expect(mockGetAllStakes).toHaveBeenCalledWith(
        expect.objectContaining({
          isTestnet: false,
          addresses: ['avax123']
        })
      )

      // Opposite network has empty addresses so getAllStakes is not called for it
      // getAllStakes should only be called once (for current network)
      expect(mockGetAllStakes).toHaveBeenCalledTimes(1)

      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({
        txHash: 'tx-current'
      })
    })

    it('should handle multiple accounts with mixed results', async () => {
      mockGetAddressesFromXpubXP.mockImplementation(({ accountIndex }) => {
        if (accountIndex === 0) {
          return Promise.resolve({
            xpAddresses: [{ address: 'avax123', index: 0 }]
          })
        } else {
          // Account 2 throws error
          throw new Error('Account 2 error')
        }
      })

      mockGetAllStakes.mockResolvedValue([
        {
          txHash: 'tx-multi',
          endTimestamp: 3333333333,
          emittedUtxos: [
            {
              staked: true,
              addresses: ['avax123']
            }
          ]
        }
      ])

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount, mockAccount2],
        isTestnet: false
      })

      // Should have called with addresses from account 1 and fallback for account 2
      expect(mockGetAllStakes).toHaveBeenCalledWith(
        expect.objectContaining({
          isTestnet: false,
          addresses: expect.arrayContaining(['avax123', 'avax789'])
        })
      )

      expect(result).toBeDefined()
    })

    it('should return undefined when entire operation fails', async () => {
      mockGetAddressesFromXpubXP.mockResolvedValue({
        xpAddresses: [{ address: 'avax123', index: 0 }]
      })

      mockGetAllStakes.mockRejectedValue(new Error('API failure'))

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount],
        isTestnet: false
      })

      expect(result).toBeUndefined()
    })

    it('should handle account without addressPVM when getAddressesFromXpubXP returns empty', async () => {
      const accountWithoutPVM = {
        ...mockAccount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addressPVM: undefined as any
      } as Account

      mockGetAddressesFromXpubXP.mockResolvedValue({
        xpAddresses: []
      })

      // Mock not needed - getAllStakes won't be called when addresses are empty
      mockGetAllStakes.mockResolvedValue([])

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [accountWithoutPVM],
        isTestnet: false
      })

      // When addresses array is empty, getAllStakes is not called at all
      expect(mockGetAllStakes).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })
  })
})
