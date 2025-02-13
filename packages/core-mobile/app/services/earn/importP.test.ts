import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { importP } from 'services/earn/importP'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'

describe('earn/importP', () => {
  describe('importP', () => {
    const getTxStatusMockFn = jest.fn().mockReturnValue({
      status: 'Committed'
    })
    jest.mock('services/network/NetworkService')
    jest.spyOn(NetworkService, 'getAvalancheProviderXP').mockResolvedValue(
      Promise.resolve({
        getApiP: () => {
          return {
            getTxStatus: getTxStatusMockFn
          }
        }
      }) as unknown as Avalanche.JsonRpcProvider
    )
    jest.spyOn(NetworkService, 'sendTransaction').mockImplementation(() => {
      return Promise.resolve('mockTxHash')
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
        isDevMode: false,
        selectedCurrency: VsCurrencyType.USD
      })
      expect(WalletService.createImportPTx).toHaveBeenCalled()
    })

    it('should call walletService.signAvaxTx', async () => {
      await importP({
        activeAccount: {} as Account,
        isDevMode: false,
        selectedCurrency: VsCurrencyType.USD
      })
      expect(WalletService.sign).toHaveBeenCalled()
    })

    it('should call networkService.sendTransaction', async () => {
      await importP({
        activeAccount: {} as Account,
        isDevMode: false,
        selectedCurrency: VsCurrencyType.USD
      })
      expect(NetworkService.sendTransaction).toHaveBeenCalled()
    })
  })
})
