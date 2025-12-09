import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { importP } from 'services/earn/importP'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { WalletType } from 'services/wallet/types'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'

describe('earn/importP', () => {
  describe('importP', () => {
    const getTxStatusMockFn = jest.fn().mockReturnValue({
      status: 'Committed'
    })
    jest.mock('services/network/NetworkService')
    jest.spyOn(NetworkService, 'getAvalancheProviderXP').mockResolvedValue({
      getApiP: () => ({
        getTxStatus: getTxStatusMockFn
      })
    } as any)
    jest.spyOn(NetworkService, 'sendTransaction').mockImplementation(() => {
      return Promise.resolve('mockTxHash')
    })

    jest.mock('services/wallet/AvalancheWalletService')
    jest
      .spyOn(AvalancheWalletService, 'createImportPTx')
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

    it('should call AvalancheWalletService.createImportPTx', async () => {
      await importP({
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        account: {} as Account,
        isTestnet: false,
        selectedCurrency: VsCurrencyType.USD
      })
      expect(AvalancheWalletService.createImportPTx).toHaveBeenCalled()
    })

    it('should call walletService.signAvaxTx', async () => {
      await importP({
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        account: {} as Account,
        isTestnet: false,
        selectedCurrency: VsCurrencyType.USD
      })
      expect(WalletService.sign).toHaveBeenCalled()
    })

    it('should call networkService.sendTransaction', async () => {
      await importP({
        walletId: 'test-wallet-id',
        walletType: WalletType.MNEMONIC,
        account: {} as Account,
        isTestnet: false,
        selectedCurrency: VsCurrencyType.USD
      })
      expect(NetworkService.sendTransaction).toHaveBeenCalled()
    })
  })
})
