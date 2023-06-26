import { exportC } from 'services/earn/exportC'
import { BN } from 'bn.js'
import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs-v2'
import mockNetworks from 'tests/fixtures/networks.json'
import { AVALANCHE_XP_NETWORK, Network } from '@avalabs/chains-sdk'

describe('earn/exportC', () => {
  describe('exportC', () => {
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
          cChainBalance: new BN(1e9),
          requiredAmount: new BN(1e10),
          isDevMode: false,
          activeAccount: {} as Account,
          networkService: NetworkService,
          walletService: WalletService
        })
      }).rejects.toThrow('Not enough balance on C chain')
    })

    it('should call avaxProvider.getApiC().getBaseFee()', async () => {
      await exportC({
        cChainBalance: new BN(1e9),
        requiredAmount: new BN(1e8),
        isDevMode: false,
        activeAccount: {} as Account,
        networkService: NetworkService,
        walletService: WalletService
      })
      expect(baseFeeMockFn).toHaveBeenCalled()
    })

    it('should call walletService.createExportCTx', async () => {
      const result = await exportC({
        cChainBalance: new BN(1e9),
        requiredAmount: new BN(1e8),
        isDevMode: false,
        activeAccount: {} as Account,
        networkService: NetworkService,
        walletService: WalletService
      })
      expect(WalletService.createExportCTx).toHaveBeenCalledWith(
        BigInt(101000000),
        BigInt(30),
        undefined,
        AVALANCHE_XP_NETWORK,
        'P',
        undefined
      )
      expect(result).toBe(true)
    })

    it('should call walletService.signAvaxTx', async () => {
      const result = await exportC({
        cChainBalance: new BN(1e9),
        requiredAmount: new BN(1e8),
        isDevMode: false,
        activeAccount: {} as Account,
        networkService: NetworkService,
        walletService: WalletService
      })
      expect(WalletService.sign).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it('should call networkService.sendTransaction', async () => {
      const result = await exportC({
        cChainBalance: new BN(1e9),
        requiredAmount: new BN(1e8),
        isDevMode: false,
        activeAccount: {} as Account,
        networkService: NetworkService,
        walletService: WalletService
      })
      expect(NetworkService.sendTransaction).toHaveBeenCalled()
      expect(result).toBe(true)
    })
  })
})
