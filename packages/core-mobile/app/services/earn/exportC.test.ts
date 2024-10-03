import { exportC } from 'services/earn/exportC'
import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import mockNetworks from 'tests/fixtures/networks.json'
import { Network } from '@avalabs/core-chains-sdk'

describe('earn/exportC', () => {
  describe('exportC', () => {
    const baseFeeMockFn = jest.fn().mockReturnValue(BigInt(25e9))
    const getAtomicTxStatusMockFn = jest.fn().mockReturnValue({
      status: 'Accepted'
    })
    jest.mock('services/network/NetworkService')
    jest
      .spyOn(NetworkService, 'getAvalancheProviderXP')
      .mockImplementation(() => {
        return {
          getApiC: () => {
            return {
              getBaseFee: baseFeeMockFn,
              getAtomicTxStatus: getAtomicTxStatusMockFn
            }
          }
        } as unknown as Avalanche.JsonRpcProvider
      })
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
          cChainBalance: BigInt(1e18),
          requiredAmount: BigInt(10e18),
          isDevMode: false,
          activeAccount: {} as Account
        })
      }).rejects.toThrow('Not enough balance on C chain')
    })

    it('should call avaxProvider.getApiC().getBaseFee()', async () => {
      await exportC({
        cChainBalance: BigInt(1e18),
        requiredAmount: BigInt(0.1e18),
        isDevMode: false,
        activeAccount: {} as Account
      })
      expect(baseFeeMockFn).toHaveBeenCalled()
    })

    it('should call walletService.createExportCTx', async () => {
      expect(async () => {
        await exportC({
          cChainBalance: BigInt(1e18),
          requiredAmount: BigInt(0.1e18),
          isDevMode: false,
          activeAccount: {} as Account
        })
        expect(WalletService.createExportCTx).toHaveBeenCalledWith({
          amount: BigInt(0.101e18),
          baseFee: BigInt(30e9),
          accountIndex: undefined,
          avaxXPNetwork: NetworkService.getAvalancheNetworkP(false),
          destinationChain: 'P',
          destinationAddress: undefined
        })
      }).not.toThrow()
    })

    it('should call walletService.signAvaxTx', async () => {
      expect(async () => {
        await exportC({
          cChainBalance: BigInt(1e18),
          requiredAmount: BigInt(0.1e18),
          isDevMode: false,
          activeAccount: {} as Account
        })
        expect(WalletService.sign).toHaveBeenCalled()
      }).not.toThrow()
    })

    it('should call networkService.sendTransaction', async () => {
      expect(async () => {
        await exportC({
          cChainBalance: BigInt(1e18),
          requiredAmount: BigInt(0.1e18),
          isDevMode: false,
          activeAccount: {} as Account
        })
        expect(NetworkService.sendTransaction).toHaveBeenCalled()
      }).not.toThrow()
    })
  })
})
