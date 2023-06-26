import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/wallets-sdk'
import { avaxSerial, UnsignedTx } from '@avalabs/avalanchejs-v2'
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
    jest.spyOn(WalletService, 'signAvaxTx').mockImplementation(() => {
      return Promise.resolve({} as avaxSerial.SignedTx)
    })

    it('should call walletService.createImportPTx', async () => {
      await importP({
        walletService: WalletService,
        networkService: NetworkService,
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(WalletService.createImportPTx).toHaveBeenCalled()
    })

    it('should call walletService.signAvaxTx', async () => {
      await importP({
        walletService: WalletService,
        networkService: NetworkService,
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(WalletService.signAvaxTx).toHaveBeenCalled()
    })

    it('should call networkService.sendTransaction', async () => {
      await importP({
        walletService: WalletService,
        networkService: NetworkService,
        activeAccount: {} as Account,
        isDevMode: false
      })
      expect(NetworkService.sendTransaction).toHaveBeenCalled()
    })
  })
})
