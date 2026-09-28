import { exportC } from 'services/earn/exportC'
import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche, JsonRpcBatchInternal } from '@avalabs/core-wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import mockNetworks from 'tests/fixtures/networks.json'
import { Network } from '@avalabs/core-chains-sdk'
import { WalletType } from 'services/wallet/types'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { maxTransactionStatusCheckRetries } from 'services/earn/utils'

const testCBaseFeeMultiplier = 1

const avalancheEvmProvider = {
  getTransactionCount: jest.fn().mockResolvedValue(0)
} as unknown as JsonRpcBatchInternal

describe('earn/exportC', () => {
  describe('exportC', () => {
    const testXpAddresses = ['avax123', 'avax456']

    const baseFeeMockFn = jest.fn().mockReturnValue(BigInt(0.003 * 1e9))
    // The node only sets blockHeight once the atomic tx is accepted, so its
    // presence is what confirms the export (avax.getAtomicTxStatus was removed
    // from the node in avalanchego v1.15.0).
    const getAtomicTxMockFn = jest.fn().mockResolvedValue({
      blockHeight: 58717503n
    })
    jest.mock('services/network/NetworkService')
    jest.spyOn(NetworkService, 'getAvalancheProviderXP').mockResolvedValue(
      Promise.resolve({
        getApiC: () => {
          return {
            getBaseFee: baseFeeMockFn,
            getAtomicTx: getAtomicTxMockFn
          }
        }
      }) as unknown as Avalanche.JsonRpcProvider
    )
    jest.spyOn(NetworkService, 'sendTransaction').mockImplementation(() => {
      return Promise.resolve('mockTxHash')
    })
    jest.spyOn(NetworkService, 'getNetworks').mockImplementation(() => {
      return Promise.resolve(
        mockNetworks as unknown as { [chainId: number]: Network }
      )
    })

    jest.mock('services/wallet/AvalancheWalletService')
    jest
      .spyOn(AvalancheWalletService, 'createExportCTx')
      .mockImplementation(() => {
        return Promise.resolve({} as UnsignedTx)
      })
    jest.spyOn(WalletService, 'sign').mockImplementation(() => {
      return Promise.resolve(
        JSON.stringify({
          codecId: '0',
          vm: EVM,
          txBytes: utils.hexToBuffer('0x00'),
          utxos: [],
          addressMaps: {},
          credentials: []
        })
      )
    })
    jest.spyOn(UnsignedTx, 'fromJSON').mockImplementation(() => {
      return {
        getSignedTx: () => {
          return {} as avaxSerial.SignedTx
        }
      } as UnsignedTx
    })

    it('should fail if cChainBalance is less than required amount', async () => {
      await expect(async () => {
        await exportC({
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          cChainBalanceWei: BigInt(1e18),
          requiredAmountWei: BigInt(10e18),
          isTestnet: false,
          account: {} as Account,
          cBaseFeeMultiplier: testCBaseFeeMultiplier,
          avalancheEvmProvider,
          xpAddresses: testXpAddresses
        })
      }).rejects.toThrow('Not enough balance on C chain')
    })

    it('should call avaxProvider.getApiC().getBaseFee()', async () => {
      await exportC({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        cChainBalanceWei: BigInt(10e18),
        requiredAmountWei: BigInt(1e18),
        isTestnet: false,
        account: {} as Account,
        cBaseFeeMultiplier: testCBaseFeeMultiplier,
        avalancheEvmProvider,
        xpAddresses: []
      })
      expect(baseFeeMockFn).toHaveBeenCalled()
    })

    it('should call walletService.createExportCTx', async () => {
      expect(async () => {
        await exportC({
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          cChainBalanceWei: BigInt(10e18),
          requiredAmountWei: BigInt(1e18),
          isTestnet: false,
          account: {} as Account,
          cBaseFeeMultiplier: testCBaseFeeMultiplier,
          avalancheEvmProvider,
          xpAddresses: testXpAddresses
        })
        expect(AvalancheWalletService.createExportCTx).toHaveBeenCalledWith({
          amountInNAvax: 1000000000n,
          baseFeeInNAvax: 1n,
          destinationChain: 'P',
          destinationAddress: undefined,
          isTestnet: false,
          account: {} as Account,
          avalancheEvmProvider,
          xpAddresses: testXpAddresses
        })
      }).not.toThrow()
    })

    it('should call walletService.signAvaxTx', async () => {
      expect(async () => {
        await exportC({
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          cChainBalanceWei: BigInt(10e18),
          requiredAmountWei: BigInt(1e18),
          isTestnet: false,
          account: {} as Account,
          cBaseFeeMultiplier: testCBaseFeeMultiplier,
          avalancheEvmProvider,
          xpAddresses: testXpAddresses
        })
        expect(WalletService.sign).toHaveBeenCalled()
      }).not.toThrow()
    })

    it('should call networkService.sendTransaction', async () => {
      expect(async () => {
        await exportC({
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          cChainBalanceWei: BigInt(10e18),
          requiredAmountWei: BigInt(1e18),
          isTestnet: false,
          account: {} as Account,
          cBaseFeeMultiplier: testCBaseFeeMultiplier,
          avalancheEvmProvider,
          xpAddresses: testXpAddresses
        })
        expect(NetworkService.sendTransaction).toHaveBeenCalled()
      }).not.toThrow()
    })

    describe('confirming the export', () => {
      const exportCArgs = {
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        cChainBalanceWei: BigInt(10e18),
        requiredAmountWei: BigInt(1e18),
        isTestnet: false,
        account: {} as Account,
        cBaseFeeMultiplier: testCBaseFeeMultiplier,
        avalancheEvmProvider,
        xpAddresses: testXpAddresses
      }

      beforeEach(() => {
        getAtomicTxMockFn.mockClear()
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      it('should resolve once getAtomicTx reports a block height', async () => {
        getAtomicTxMockFn.mockResolvedValue({ blockHeight: 58717503n })

        await expect(exportC(exportCArgs)).resolves.toBeUndefined()

        expect(getAtomicTxMockFn).toHaveBeenCalledWith({ txID: 'mockTxHash' })
        expect(getAtomicTxMockFn).toHaveBeenCalledTimes(1)
      })

      it('should keep polling while the tx has no block height yet', async () => {
        jest.useFakeTimers()
        getAtomicTxMockFn
          .mockRejectedValueOnce(
            new Error('fetching tx: reading tx: not found')
          )
          .mockResolvedValueOnce({ blockHeight: undefined })
          .mockResolvedValueOnce({ blockHeight: 58717503n })

        const promise = exportC(exportCArgs)

        await jest.advanceTimersByTimeAsync(1000)
        await jest.advanceTimersByTimeAsync(2000)
        await expect(promise).resolves.toBeUndefined()

        expect(getAtomicTxMockFn).toHaveBeenCalledTimes(3)
      })

      it('should throw FundsStuckError when the tx never gets a block height', async () => {
        jest.useFakeTimers()
        getAtomicTxMockFn.mockResolvedValue({ blockHeight: undefined })

        const promise = exportC(exportCArgs)
        // Settled only after the timers below run, so swallow the rejection
        // here to keep it from surfacing as an unhandled one meanwhile.
        promise.catch(() => undefined)

        for (let retry = 0; retry < maxTransactionStatusCheckRetries; retry++) {
          await jest.advanceTimersByTimeAsync(2 ** retry * 1000)
        }
        await expect(promise).rejects.toThrow('Export did not finish')

        expect(getAtomicTxMockFn).toHaveBeenCalledTimes(
          maxTransactionStatusCheckRetries
        )
      })
    })
  })
})
