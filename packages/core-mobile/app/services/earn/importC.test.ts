import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { importC } from 'services/earn/importC'
import { AVALANCHE_XP_NETWORK } from '@avalabs/chains-sdk'
import { Avax } from 'types/Avax'

describe('earn/importC', () => {
  describe('importC', () => {
    const baseFeeMockFn = jest.fn().mockReturnValue(BigInt(250000e9))
    const getAtomicTxStatusMockFn = jest.fn().mockReturnValue({
      status: 'Accepted'
    })
    jest.mock('services/network/NetworkService')
    jest
      .spyOn(NetworkService, 'getProviderForNetwork')
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

    jest.mock('services/wallet/WalletService')
    jest.spyOn(WalletService, 'createImportCTx').mockImplementation(() => {
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

    it('should call walletService.createImportCTx', async () => {
      await importC({
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(WalletService.createImportCTx).toHaveBeenCalledWith({
        accountIndex: undefined,
        baseFee: Avax.fromBase(0.0003),
        avaxXPNetwork: AVALANCHE_XP_NETWORK,
        sourceChain: 'P',
        destinationAddress: undefined
      })
    })

    it('should call walletService.signAvaxTx', async () => {
      await importC({
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(WalletService.sign).toHaveBeenCalled()
    })

    it('should call networkService.sendTransaction', async () => {
      await importC({
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(NetworkService.sendTransaction).toHaveBeenCalled()
    })
  })
})
