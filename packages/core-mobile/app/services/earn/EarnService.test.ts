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

jest.mock('hooks/useXPAddresses/useXPAddresses', () => ({
  getCachedXPAddresses: jest.fn()
}))

jest.mock('./utils', () => {
  const actual = jest.requireActual('./utils')
  return {
    ...actual,
    getTransformedTransactions: jest.fn()
  }
})

jest.mock('utils/runAfterInteractions', () => ({
  runAfterInteractions: jest.fn((callback: () => Promise<unknown>) =>
    callback()
  )
}))

const { getCachedXPAddresses } = require('hooks/useXPAddresses/useXPAddresses')
const { getTransformedTransactions } = require('./utils')

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
  addressSVM: 'svm123'
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
  addressSVM: 'svm789'
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('getTransformedStakesForAllAccounts', () => {
    let mockGetAllStakes: jest.SpyInstance

    beforeEach(() => {
      jest.clearAllMocks()
      mockGetAllStakes = jest.spyOn(EarnService, 'getAllStakes')
    })

    afterEach(() => {
      mockGetAllStakes.mockRestore()
    })

    it('should return transformed stakes when getCachedXPAddresses returns addresses', async () => {
      // Mock for both current network (isTestnet=false) and opposite network (isTestnet=true)
      getCachedXPAddresses.mockImplementation(
        ({ isDeveloperMode }: { isDeveloperMode: boolean }) => {
          return Promise.resolve({
            xpAddresses:
              isDeveloperMode === false ? ['avax123', 'avax456'] : [],
            xpAddressDictionary:
              isDeveloperMode === false
                ? {
                    avax123: { space: 'e', index: 0, hasActivity: true },
                    avax456: { space: 'i', index: 1, hasActivity: true }
                  }
                : {}
          })
        }
      )

      // Mock getTransformedTransactions to return transactions
      getTransformedTransactions.mockImplementation(
        (addresses: string[], isTestnet: boolean) => {
          if (addresses.length > 0) {
            return Promise.resolve([
              {
                txHash: 'tx123',
                endTimestamp: 1234567890,
                index: 0,
                isDeveloperMode: isTestnet
              }
            ])
          }
          return Promise.resolve([])
        }
      )

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

    it('should return empty when getCachedXPAddresses returns empty', async () => {
      // Return empty for both networks
      getCachedXPAddresses.mockImplementation(() => {
        return Promise.resolve({
          xpAddresses: [],
          xpAddressDictionary: {}
        })
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

      // When xpAddresses is empty, getAllStakes is not called
      expect(mockGetAllStakes).not.toHaveBeenCalled()
      expect(result).toHaveLength(0)
    })

    it('should handle getCachedXPAddresses returning empty for current network', async () => {
      getCachedXPAddresses.mockImplementation(
        ({ isDeveloperMode }: { isDeveloperMode: boolean }) => {
          if (isDeveloperMode === false) {
            // Current network returns empty (simulating error case)
            return Promise.resolve({
              xpAddresses: [],
              xpAddressDictionary: {}
            })
          }
          // Opposite network succeeds
          return Promise.resolve({
            xpAddresses: ['fuji789'],
            xpAddressDictionary: {
              fuji789: { space: 'e', index: 0, hasActivity: true }
            }
          })
        }
      )

      getTransformedTransactions.mockImplementation(
        (addresses: string[], isTestnet: boolean) => {
          if (addresses.length > 0 && isTestnet === true) {
            return Promise.resolve([
              {
                txHash: 'tx-stake',
                endTimestamp: 1111111111,
                index: 0,
                isDeveloperMode: true
              }
            ])
          }
          return Promise.resolve([])
        }
      )

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount],
        isTestnet: false
      })

      // Should return stakes from opposite network despite current network returning empty
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({
        txHash: 'tx-stake',
        isDeveloperMode: true
      })
    })

    it('should return stakes when getCachedXPAddresses returns empty for opposite network', async () => {
      getCachedXPAddresses.mockImplementation(
        ({ isDeveloperMode }: { isDeveloperMode: boolean }) => {
          if (isDeveloperMode === true) {
            // Opposite network returns empty
            return Promise.resolve({
              xpAddresses: [],
              xpAddressDictionary: {}
            })
          }
          // Current network succeeds
          return Promise.resolve({
            xpAddresses: ['avax123'],
            xpAddressDictionary: {
              avax123: { space: 'e', index: 0, hasActivity: true }
            }
          })
        }
      )

      getTransformedTransactions.mockImplementation(
        (addresses: string[], isTestnet: boolean) => {
          if (addresses.length > 0 && isTestnet === false) {
            return Promise.resolve([
              {
                txHash: 'tx-current',
                endTimestamp: 2222222222,
                index: 0,
                isDeveloperMode: false
              }
            ])
          }
          return Promise.resolve([])
        }
      )

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount],
        isTestnet: false
      })

      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({
        txHash: 'tx-current'
      })
    })

    it('should handle multiple accounts with mixed results', async () => {
      getCachedXPAddresses.mockImplementation(
        ({
          account,
          isDeveloperMode
        }: {
          account: Account
          isDeveloperMode: boolean
        }) => {
          if (account.index === 0 && isDeveloperMode === false) {
            return Promise.resolve({
              xpAddresses: ['avax123'],
              xpAddressDictionary: {
                avax123: { space: 'e', index: 0, hasActivity: true }
              }
            })
          } else {
            // Account 2 or opposite network returns empty
            return Promise.resolve({
              xpAddresses: [],
              xpAddressDictionary: {}
            })
          }
        }
      )

      getTransformedTransactions.mockImplementation(
        (addresses: string[], isTestnet: boolean) => {
          if (addresses.length > 0 && isTestnet === false) {
            return Promise.resolve([
              {
                txHash: 'tx-multi',
                endTimestamp: 3333333333,
                index: 0,
                isDeveloperMode: false
              }
            ])
          }
          return Promise.resolve([])
        }
      )

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount, mockAccount2],
        isTestnet: false
      })

      expect(result).toBeDefined()
      expect(result).toHaveLength(1)
      expect(result?.[0]).toMatchObject({
        txHash: 'tx-multi',
        accountId: 'account-1'
      })
    })

    it('should return undefined when entire operation fails', async () => {
      getCachedXPAddresses.mockImplementation(
        ({ isDeveloperMode }: { isDeveloperMode: boolean }) => {
          return Promise.resolve({
            xpAddresses: isDeveloperMode === false ? ['avax123'] : [],
            xpAddressDictionary:
              isDeveloperMode === false
                ? {
                    avax123: { space: 'e', index: 0, hasActivity: true }
                  }
                : {}
          })
        }
      )

      getTransformedTransactions.mockRejectedValue(new Error('API failure'))

      const result = await EarnService.getTransformedStakesForAllAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [mockAccount],
        isTestnet: false
      })

      expect(result).toBeUndefined()
    })

    it('should handle account when getCachedXPAddresses returns empty', async () => {
      const accountWithoutPVM = {
        ...mockAccount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addressPVM: undefined as any
      } as Account

      getCachedXPAddresses.mockImplementation(() => {
        return Promise.resolve({
          xpAddresses: [],
          xpAddressDictionary: {}
        })
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
