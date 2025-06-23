import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import { importC } from 'services/earn/importC'
import { WalletType } from 'services/wallet/types'

const testCBaseFeeMultiplier = 1

describe('earn/importC', () => {
  describe('importC', () => {
    const baseFeeMockFn = jest.fn().mockReturnValue(BigInt(250000e9))
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
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      ) as jest.Mock
      await importC({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        activeAccount: {} as Account,
        isDevMode: false,
        cBaseFeeMultiplier: testCBaseFeeMultiplier
      })
      expect(WalletService.createImportCTx).toHaveBeenCalledWith({
        accountIndex: undefined,
        baseFeeInNAvax: BigInt(0.0005 * 10 ** 9),
        avaxXPNetwork: NetworkService.getAvalancheNetworkP(false),
        sourceChain: 'P',
        destinationAddress: undefined,
        walletId: 'wallet-1',
        walletType: 'MNEMONIC'
      })
    })

    it('should call walletService.signAvaxTx', async () => {
      await importC({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        activeAccount: {} as Account,
        isDevMode: false,
        cBaseFeeMultiplier: testCBaseFeeMultiplier
      })
      expect(WalletService.sign).toHaveBeenCalled()
    })

    it('should call networkService.sendTransaction', async () => {
      await importC({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        activeAccount: {} as Account,
        isDevMode: false,
        cBaseFeeMultiplier: testCBaseFeeMultiplier
      })
      expect(NetworkService.sendTransaction).toHaveBeenCalled()
    })
  })
})
