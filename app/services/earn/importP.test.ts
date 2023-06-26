import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs-v2'
import { importP } from 'services/earn/importP'

describe('earn/importP', () => {
  describe('importP', () => {
    const baseFeeMockFn = jest.fn().mockReturnValue(BigInt(25))
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
      return Promise.resolve('')
    })

    jest.mock('services/wallet/WalletService')
    jest.spyOn(WalletService, 'createImportPTx').mockImplementation(() => {
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

    it('should call walletService.createImportPTx', async () => {
      await importP({
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(WalletService.createImportPTx).toHaveBeenCalled()
    })

    it('should call walletService.signAvaxTx', async () => {
      await importP({
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(WalletService.sign).toHaveBeenCalled()
    })

    it('should call networkService.sendTransaction', async () => {
      await importP({
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(NetworkService.sendTransaction).toHaveBeenCalled()
    })
  })
})
