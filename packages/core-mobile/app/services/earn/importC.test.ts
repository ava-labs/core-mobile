import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { importC } from 'services/earn/importC'
import { WalletType } from 'services/wallet/types'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'
import { maxTransactionStatusCheckRetries } from 'services/earn/utils'
import Logger from 'utils/Logger'
import { SentryTag } from 'services/sentry/types'

const testCBaseFeeMultiplier = 1

describe('earn/importC', () => {
  describe('importC', () => {
    const testXpAddresses = ['avax123', 'avax456']

    const baseFeeMockFn = jest.fn().mockReturnValue(BigInt(250000e9))
    // The node only sets blockHeight once the atomic tx is accepted, so its
    // presence is what confirms the import (avax.getAtomicTxStatus was removed
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

    jest.mock('services/wallet/AvalancheWalletService')
    jest
      .spyOn(AvalancheWalletService, 'createImportCTx')
      .mockImplementation(() => {
        return Promise.resolve({ utxos: [] } as unknown as UnsignedTx)
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

    it('should call walletService.createImportCTx', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      ) as jest.Mock
      await importC({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        account: {} as Account,
        isTestnet: false,
        cBaseFeeMultiplier: testCBaseFeeMultiplier,
        xpAddresses: testXpAddresses
      })
      expect(AvalancheWalletService.createImportCTx).toHaveBeenCalledWith({
        baseFeeInNAvax: BigInt(0.0005 * 10 ** 9),
        sourceChain: 'P',
        destinationAddress: undefined,
        isTestnet: false,
        account: {} as Account,
        xpAddresses: testXpAddresses
      })
    })

    it('should call walletService.signAvaxTx', async () => {
      await importC({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        account: {} as Account,
        isTestnet: false,
        cBaseFeeMultiplier: testCBaseFeeMultiplier,
        xpAddresses: testXpAddresses
      })
      expect(WalletService.sign).toHaveBeenCalled()
    })

    it('should call networkService.sendTransaction', async () => {
      await importC({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        account: {} as Account,
        isTestnet: false,
        cBaseFeeMultiplier: testCBaseFeeMultiplier,
        xpAddresses: testXpAddresses
      })
      expect(NetworkService.sendTransaction).toHaveBeenCalled()
    })

    describe('confirming the import', () => {
      const importCArgs = {
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        account: {} as Account,
        isTestnet: false,
        cBaseFeeMultiplier: testCBaseFeeMultiplier,
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

        await expect(importC(importCArgs)).resolves.toBeUndefined()

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

        const promise = importC(importCArgs)

        await jest.advanceTimersByTimeAsync(1000)
        await jest.advanceTimersByTimeAsync(2000)
        await expect(promise).resolves.toBeUndefined()

        expect(getAtomicTxMockFn).toHaveBeenCalledTimes(3)
      })

      it('should throw FundsStuckError when the tx never gets a block height', async () => {
        jest.useFakeTimers()
        getAtomicTxMockFn.mockResolvedValue({ blockHeight: undefined })

        const promise = importC(importCArgs)
        // Settled only after the timers below run, so swallow the rejection
        // here to keep it from surfacing as an unhandled one meanwhile.
        promise.catch(() => undefined)

        for (let retry = 0; retry < maxTransactionStatusCheckRetries; retry++) {
          await jest.advanceTimersByTimeAsync(2 ** retry * 1000)
        }
        await expect(promise).rejects.toThrow('Import did not finish')

        expect(getAtomicTxMockFn).toHaveBeenCalledTimes(
          maxTransactionStatusCheckRetries
        )
      })

      // Sentry groups by the inner error when one is passed, so 'importC
      // failed' lands in an extra and every earn confirmation failure collapses
      // into an indistinguishable "Max retry exceeded" bucket. Tags survive
      // grouping, so they are what makes the leg identifiable.
      it('should tag the confirmation failure so it is identifiable in Sentry', async () => {
        jest.useFakeTimers()
        const loggerSpy = jest
          .spyOn(Logger, 'error')
          .mockImplementation(() => undefined)
        getAtomicTxMockFn.mockResolvedValue({ blockHeight: undefined })

        const promise = importC(importCArgs)
        promise.catch(() => undefined)

        for (let retry = 0; retry < maxTransactionStatusCheckRetries; retry++) {
          await jest.advanceTimersByTimeAsync(2 ** retry * 1000)
        }
        await expect(promise).rejects.toThrow('Import did not finish')

        expect(loggerSpy).toHaveBeenCalledWith(
          'importC failed',
          expect.anything(),
          { source: SentryTag.Earn, operation: 'importC' }
        )

        loggerSpy.mockRestore()
      })
    })
  })
})
