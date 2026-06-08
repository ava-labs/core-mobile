import { NetworkVMType } from '@avalabs/core-chains-sdk'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'
import { streamingBalanceApiClient } from 'utils/api/clients/balanceApiClient'
import ModuleManager from 'vmModule/ModuleManager'
import AccountsService from './AccountsService'

jest.mock('vmModule/ModuleManager', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    loadModuleByNetwork: jest.fn(),
    deriveAddresses: jest.fn(),
    deriveAllAddresses: jest.fn()
  }
}))

jest.mock('services/wallet/WalletService', () => ({
  __esModule: true,
  default: {
    getRawXpubXP: jest.fn(),
    hasActivityFromXpubXP: jest.fn()
  }
}))

jest.mock('utils/api/clients/balanceApiClient', () => ({
  streamingBalanceApiClient: {
    getBalances: jest.fn()
  }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}))

type AddressRecord = Record<NetworkVMType, string>

const createAddresses = (
  overrides: Partial<Record<NetworkVMType, string>> = {}
): AddressRecord =>
  ({
    [NetworkVMType.EVM]: '',
    [NetworkVMType.BITCOIN]: '',
    [NetworkVMType.AVM]: '',
    [NetworkVMType.PVM]: '',
    [NetworkVMType.CoreEth]: '',
    [NetworkVMType.SVM]: '',
    ...overrides
  } as AddressRecord)

const createBalanceStream = (...items: unknown[]): AsyncGenerator<unknown> =>
  (async function* () {
    for (const item of items) {
      yield item
    }
  })()

const createDeferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

const createHistoryModule = () => ({
  getTransactionHistory: jest.fn().mockResolvedValue({ transactions: [] })
})

describe('AccountsService', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
    ;(ModuleManager.init as jest.Mock).mockResolvedValue(undefined)
    ;(ModuleManager.loadModuleByNetwork as jest.Mock).mockImplementation(() =>
      Promise.resolve(createHistoryModule())
    )
    ;(streamingBalanceApiClient.getBalances as jest.Mock).mockReturnValue(
      createBalanceStream()
    )
  })

  describe('getSeedBasedBalanceActiveAccountIds', () => {
    it('maps both address-based and xpub-based balance activity back to discovered accounts', async () => {
      ;(WalletService.getRawXpubXP as jest.Mock)
        .mockResolvedValueOnce('xpub-1')
        .mockResolvedValueOnce('xpub-2')
      ;(streamingBalanceApiClient.getBalances as jest.Mock).mockReturnValue(
        createBalanceStream(
          {
            networkType: 'evm',
            caip2Id: 'eip155:43114',
            id: '0xAbC',
            balances: {
              nativeTokenBalance: { balance: '1' },
              erc20TokenBalances: []
            },
            currency: 'usd',
            error: null
          },
          {
            networkType: 'avm',
            caip2Id: 'avax:test-x',
            id: 'scan-2',
            balances: {
              nativeTokenBalance: { balance: '0' },
              categories: {
                unlocked: [{ balance: '5' }],
                locked: [],
                atomicMemoryUnlocked: {},
                atomicMemoryLocked: {}
              }
            },
            currency: 'usd',
            error: null
          }
        )
      )

      const result = await (
        AccountsService as unknown as {
          getSeedBasedBalanceActiveAccountIds(params: {
            walletId: string
            walletType: WalletType.MNEMONIC
            accounts: Array<{
              id: string
              index: number
              addresses: AddressRecord
            }>
          }): Promise<Set<string>>
        }
      ).getSeedBasedBalanceActiveAccountIds({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        accounts: [
          {
            id: 'scan-1',
            index: 1,
            addresses: createAddresses({
              [NetworkVMType.EVM]: '0xabc',
              [NetworkVMType.BITCOIN]: 'bc1-scan-1',
              [NetworkVMType.SVM]: 'sol-scan-1',
              [NetworkVMType.PVM]: 'P-avax-scan-1'
            })
          },
          {
            id: 'scan-2',
            index: 2,
            addresses: createAddresses({
              [NetworkVMType.EVM]: '0xdef',
              [NetworkVMType.BITCOIN]: 'bc1-scan-2',
              [NetworkVMType.SVM]: 'sol-scan-2',
              [NetworkVMType.PVM]: 'P-avax-scan-2'
            })
          }
        ]
      })

      expect([...result]).toEqual(['scan-1', 'scan-2'])
    })
  })

  describe('discoverSeedBasedActiveAccounts', () => {
    it('uses the balance batch to skip per-account probes for already-active accounts', async () => {
      ;(WalletService.getRawXpubXP as jest.Mock)
        .mockResolvedValueOnce('xpub-1')
        .mockResolvedValueOnce('xpub-2')
      ;(ModuleManager.deriveAllAddresses as jest.Mock).mockResolvedValueOnce([
        createAddresses({
          [NetworkVMType.EVM]: '0x111',
          [NetworkVMType.BITCOIN]: 'bc1-active'
        }),
        createAddresses({
          [NetworkVMType.EVM]: '0x222',
          [NetworkVMType.BITCOIN]: 'bc1-inactive'
        })
      ])
      ;(streamingBalanceApiClient.getBalances as jest.Mock).mockReturnValue(
        createBalanceStream({
          networkType: 'btc',
          caip2Id: 'bip122:000000000019d6689c085ae165831e93',
          id: 'bc1-active',
          balances: {
            nativeTokenBalance: {
              balance: '2',
              unconfirmedBalance: '0'
            }
          },
          currency: 'usd',
          error: null
        })
      )

      const activitySpy = jest
        .spyOn(
          AccountsService as unknown as {
            getSeedBasedActivityStatus: (params: unknown) => Promise<string>
          },
          'getSeedBasedActivityStatus'
        )
        .mockResolvedValue('inactive')

      const result = await (
        AccountsService as unknown as {
          discoverSeedBasedActiveAccounts(params: {
            walletId: string
            walletType: WalletType.MNEMONIC
            startIndex: number
            maxScan: number
            scanWindow: number
            maxConsecutiveInactive: number
          }): Promise<{
            accounts: Array<{ id: string; index: number }>
            completedCleanly: boolean
          }>
        }
      ).discoverSeedBasedActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1,
        maxScan: 2,
        scanWindow: 2,
        maxConsecutiveInactive: 2
      })

      expect(activitySpy).toHaveBeenCalledTimes(1)
      expect(activitySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          accountIndex: 2
        })
      )
      expect(result.accounts).toHaveLength(1)
      expect(result.accounts[0]).toEqual(
        expect.objectContaining({
          id: 'scan-1',
          index: 1
        })
      )
    })

    it('logs and falls back when the balance batch fails', async () => {
      ;(WalletService.getRawXpubXP as jest.Mock).mockResolvedValue('xpub-1')
      ;(ModuleManager.deriveAllAddresses as jest.Mock).mockResolvedValue([
        createAddresses({
          [NetworkVMType.EVM]: '0x111'
        })
      ])
      ;(streamingBalanceApiClient.getBalances as jest.Mock).mockImplementation(
        async function* () {
          throw new Error('balance api unavailable')
          yield undefined
        }
      )

      const activitySpy = jest
        .spyOn(
          AccountsService as unknown as {
            getSeedBasedActivityStatus: (params: unknown) => Promise<string>
          },
          'getSeedBasedActivityStatus'
        )
        .mockResolvedValue('inactive')

      await (
        AccountsService as unknown as {
          discoverSeedBasedActiveAccounts(params: {
            walletId: string
            walletType: WalletType.MNEMONIC
            startIndex: number
            maxScan: number
            scanWindow: number
            maxConsecutiveInactive: number
          }): Promise<unknown>
        }
      ).discoverSeedBasedActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1,
        maxScan: 1,
        scanWindow: 1,
        maxConsecutiveInactive: 1
      })

      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to batch-check balances during account discovery',
        expect.any(Error)
      )
      expect(activitySpy).toHaveBeenCalledTimes(1)
    })

    it('preserves consecutive inactivity across window boundaries', async () => {
      ;(WalletService.getRawXpubXP as jest.Mock).mockResolvedValue('xpub-1')
      ;(ModuleManager.deriveAllAddresses as jest.Mock).mockImplementation(
        async ({ accountIndices }: { accountIndices: number[] }) =>
          accountIndices.map(idx =>
            createAddresses({
              [NetworkVMType.EVM]: `0x${idx}`
            })
          )
      )

      jest
        .spyOn(
          AccountsService as unknown as {
            getSeedBasedActivityStatus: (params: unknown) => Promise<string>
          },
          'getSeedBasedActivityStatus'
        )
        .mockResolvedValue('inactive')

      await (
        AccountsService as unknown as {
          discoverSeedBasedActiveAccounts(params: {
            walletId: string
            walletType: WalletType.MNEMONIC
            startIndex: number
            maxScan: number
            scanWindow: number
            maxConsecutiveInactive: number
          }): Promise<unknown>
        }
      ).discoverSeedBasedActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1,
        maxScan: 5,
        scanWindow: 1,
        maxConsecutiveInactive: 2
      })

      expect(ModuleManager.deriveAllAddresses).toHaveBeenCalledTimes(2)
    })

    it('starts with a smaller initial scan window even when the configured window is larger', async () => {
      ;(WalletService.getRawXpubXP as jest.Mock).mockResolvedValue('xpub-1')
      ;(ModuleManager.deriveAllAddresses as jest.Mock).mockImplementation(
        async ({ accountIndices }: { accountIndices: number[] }) =>
          accountIndices.map(idx =>
            createAddresses({
              [NetworkVMType.EVM]: `0x${idx}`
            })
          )
      )

      jest
        .spyOn(
          AccountsService as unknown as {
            getSeedBasedActivityStatus: (params: unknown) => Promise<string>
          },
          'getSeedBasedActivityStatus'
        )
        .mockResolvedValue('inactive')

      await (
        AccountsService as unknown as {
          discoverSeedBasedActiveAccounts(params: {
            walletId: string
            walletType: WalletType.MNEMONIC
            startIndex: number
            maxScan: number
            scanWindow: number
            maxConsecutiveInactive: number
          }): Promise<unknown>
        }
      ).discoverSeedBasedActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1,
        maxScan: 8,
        scanWindow: 6,
        maxConsecutiveInactive: 2
      })

      expect(ModuleManager.deriveAllAddresses).toHaveBeenCalledTimes(1)
    })

    it('stops waiting for later prefetched probes once the inactivity threshold is reached', async () => {
      ;(WalletService.getRawXpubXP as jest.Mock).mockResolvedValue('xpub-1')
      ;(ModuleManager.deriveAllAddresses as jest.Mock).mockImplementation(
        async ({ accountIndices }: { accountIndices: number[] }) =>
          accountIndices.map(idx =>
            createAddresses({
              [NetworkVMType.EVM]: `0x${idx}`,
              [NetworkVMType.BITCOIN]: `bc1-${idx}`
            })
          )
      )
      ;(streamingBalanceApiClient.getBalances as jest.Mock)
        .mockReturnValueOnce(
          createBalanceStream({
            networkType: 'avm',
            caip2Id: 'avax:test-x',
            id: 'scan-1',
            balances: {
              nativeTokenBalance: { balance: '1' },
              categories: {
                unlocked: [],
                locked: [],
                atomicMemoryUnlocked: {},
                atomicMemoryLocked: {}
              }
            },
            currency: 'usd',
            error: null
          })
        )
        .mockReturnValueOnce(createBalanceStream())

      const deferredAccount4 = createDeferred<'inactive'>()
      const deferredAccount5 = createDeferred<'inactive'>()
      const activitySpy = jest
        .spyOn(
          AccountsService as unknown as {
            getSeedBasedActivityStatus: (params: {
              accountIndex: number
            }) => Promise<string>
          },
          'getSeedBasedActivityStatus'
        )
        .mockImplementation(({ accountIndex }) => {
          switch (accountIndex) {
            case 2:
            case 3:
              return Promise.resolve('inactive')
            case 4:
              return deferredAccount4.promise
            case 5:
              return deferredAccount5.promise
            default:
              return Promise.resolve('inactive')
          }
        })

      const discoveryPromise = (
        AccountsService as unknown as {
          discoverSeedBasedActiveAccounts(params: {
            walletId: string
            walletType: WalletType.MNEMONIC
            startIndex: number
            maxScan: number
            scanWindow: number
            maxConsecutiveInactive: number
          }): Promise<{
            accounts: Array<{ id: string; index: number }>
            completedCleanly: boolean
          }>
        }
      ).discoverSeedBasedActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1,
        maxScan: 8,
        scanWindow: 6,
        maxConsecutiveInactive: 2
      })

      const discoveryResultOrTimeout = await Promise.race([
        discoveryPromise,
        new Promise<'timeout'>(resolve =>
          setTimeout(() => resolve('timeout'), 100)
        )
      ])

      deferredAccount4.resolve('inactive')
      deferredAccount5.resolve('inactive')

      expect(discoveryResultOrTimeout).not.toBe('timeout')

      const result = await discoveryPromise

      expect(result.accounts).toEqual([
        expect.objectContaining({
          id: 'scan-1',
          index: 1
        })
      ])
      expect(activitySpy).toHaveBeenCalledWith(
        expect.objectContaining({ accountIndex: 2 })
      )
      expect(activitySpy).toHaveBeenCalledWith(
        expect.objectContaining({ accountIndex: 3 })
      )
      expect(activitySpy).toHaveBeenCalledWith(
        expect.objectContaining({ accountIndex: 4 })
      )
      expect(activitySpy).toHaveBeenCalledWith(
        expect.objectContaining({ accountIndex: 5 })
      )
      expect(activitySpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ accountIndex: 6 })
      )
    })

    it('reuses discovered addresses when building remaining accounts', async () => {
      ;(WalletService.getRawXpubXP as jest.Mock)
        .mockResolvedValueOnce('xpub-1')
        .mockResolvedValueOnce('xpub-2')
        .mockResolvedValueOnce('xpub-3')
      ;(ModuleManager.deriveAllAddresses as jest.Mock).mockImplementation(
        async ({ accountIndices }: { accountIndices: number[] }) =>
          accountIndices.map(idx => {
            if (idx === 1) {
              return createAddresses({
                [NetworkVMType.EVM]: '0x111',
                [NetworkVMType.BITCOIN]: 'bc1-active'
              })
            }
            return createAddresses({
              [NetworkVMType.EVM]: `0x${idx}${idx}${idx}`,
              [NetworkVMType.BITCOIN]: `bc1-inactive-${idx}`
            })
          })
      )
      ;(streamingBalanceApiClient.getBalances as jest.Mock).mockReturnValue(
        createBalanceStream({
          networkType: 'btc',
          caip2Id: 'bip122:000000000019d6689c085ae165831e93',
          id: 'bc1-active',
          balances: {
            nativeTokenBalance: {
              balance: '2',
              unconfirmedBalance: '0'
            }
          },
          currency: 'usd',
          error: null
        })
      )

      jest
        .spyOn(
          AccountsService as unknown as {
            getSeedBasedActivityStatus: (params: unknown) => Promise<string>
          },
          'getSeedBasedActivityStatus'
        )
        .mockResolvedValue('inactive')

      const { accounts } = await AccountsService.fetchRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(Object.values(accounts)).toEqual([
        expect.objectContaining({
          index: 1,
          addressC: '0x111',
          addressBTC: 'bc1-active'
        })
      ])
      expect(ModuleManager.deriveAllAddresses).toHaveBeenCalledTimes(2)
    })

    it('fills index gaps so accounts are contiguous up to the highest active index', async () => {
      // Spy on discoverSeedBasedActiveAccounts to return non-contiguous indexes [1, 3]
      const discoverSpy = jest
        .spyOn(
          AccountsService as unknown as {
            discoverSeedBasedActiveAccounts: (params: unknown) => Promise<{
              accounts: Array<{
                id: string
                index: number
                addresses: AddressRecord
              }>
              completedCleanly: boolean
            }>
          },
          'discoverSeedBasedActiveAccounts'
        )
        .mockResolvedValue({
          accounts: [
            {
              id: 'scan-1',
              index: 1,
              addresses: createAddresses({
                [NetworkVMType.EVM]: '0xActive1',
                [NetworkVMType.BITCOIN]: 'bc1-active-1'
              })
            },
            {
              id: 'scan-3',
              index: 3,
              addresses: createAddresses({
                [NetworkVMType.EVM]: '0xActive3',
                [NetworkVMType.BITCOIN]: 'bc1-active-3'
              })
            }
          ],
          completedCleanly: true
        })

      ;(ModuleManager.deriveAllAddresses as jest.Mock).mockResolvedValue([
        createAddresses({
          [NetworkVMType.EVM]: '0xGap2',
          [NetworkVMType.BITCOIN]: 'bc1-gap-2'
        })
      ])

      const { accounts } = await AccountsService.fetchRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      const accountList = Object.values(accounts).sort(
        (a, b) => a.index - b.index
      )

      // Should have 3 accounts: index 1, 2 (gap-filled), and 3
      expect(accountList).toHaveLength(3)
      expect(accountList[0]).toEqual(
        expect.objectContaining({
          index: 1,
          addressC: '0xActive1',
          addressBTC: 'bc1-active-1'
        })
      )
      expect(accountList[1]).toEqual(
        expect.objectContaining({
          index: 2,
          addressC: '0xGap2',
          addressBTC: 'bc1-gap-2'
        })
      )
      expect(accountList[2]).toEqual(
        expect.objectContaining({
          index: 3,
          addressC: '0xActive3',
          addressBTC: 'bc1-active-3'
        })
      )

      expect(ModuleManager.deriveAllAddresses).toHaveBeenCalledTimes(1)
      expect(ModuleManager.deriveAllAddresses).toHaveBeenCalledWith(
        expect.objectContaining({ accountIndices: [2] })
      )

      discoverSpy.mockRestore()
    })
  })
})
