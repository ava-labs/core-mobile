import { exportC } from 'services/earn/exportC'
import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import mockNetworks from 'tests/fixtures/networks.json'
import { Network } from '@avalabs/core-chains-sdk'
import { WalletType } from 'services/wallet/types'

const testCBaseFeeMultiplier = 1

describe('earn/exportC', () => {
  describe('exportC', () => {
    const baseFeeMockFn = jest.fn().mockReturnValue(BigInt(0.003 * 1e9))
    const getAtomicTxStatusMockFn = jest.fn().mockReturnValue({
      status: 'Accepted'
    })
    jest.mock('services/network/NetworkService')
    jest.spyOn(NetworkService, 'getAvalancheProviderXP').mockResolvedValue(
      Promise.resolve({
        getApiC: () => {
          return {
            getBaseFee: baseFeeMockFn,
            getAtomicTxStatus: getAtomicTxStatusMockFn
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

    jest.mock('services/wallet/WalletService')
    jest.spyOn(WalletService, 'createExportCTx').mockImplementation(() => {
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
          isDevMode: false,
          activeAccount: {} as Account,
          cBaseFeeMultiplier: testCBaseFeeMultiplier
        })
      }).rejects.toThrow('Not enough balance on C chain')
    })

    it('should call avaxProvider.getApiC().getBaseFee()', async () => {
      await exportC({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        cChainBalanceWei: BigInt(10e18),
        requiredAmountWei: BigInt(1e18),
        isDevMode: false,
        activeAccount: {} as Account,
        cBaseFeeMultiplier: testCBaseFeeMultiplier
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
          isDevMode: false,
          activeAccount: {} as Account,
          cBaseFeeMultiplier: testCBaseFeeMultiplier
        })
        expect(WalletService.createExportCTx).toHaveBeenCalledWith({
          amountInNAvax: 1000000000n,
          baseFeeInNAvax: 1n,
          accountIndex: undefined,
          avaxXPNetwork: NetworkService.getAvalancheNetworkP(false),
          destinationChain: 'P',
          destinationAddress: undefined,
          walletId: 'wallet-1',
          walletType: 'MNEMONIC'
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
          isDevMode: false,
          activeAccount: {} as Account,
          cBaseFeeMultiplier: testCBaseFeeMultiplier
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
          isDevMode: false,
          activeAccount: {} as Account,
          cBaseFeeMultiplier: testCBaseFeeMultiplier
        })
        expect(NetworkService.sendTransaction).toHaveBeenCalled()
      }).not.toThrow()
    })
  })
})
