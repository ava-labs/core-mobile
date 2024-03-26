import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import mockNetworks from 'tests/fixtures/networks.json'
import { AVALANCHE_XP_NETWORK, Network } from '@avalabs/chains-sdk'
import { exportP } from 'services/earn/exportP'
import { Avax } from 'types/Avax'

describe('earn/exportP', () => {
  describe('exportP', () => {
    const getTxStatusMockFn = jest.fn().mockReturnValue({
      status: 'Committed'
    })
    jest.mock('services/network/NetworkService')
    jest
      .spyOn(NetworkService, 'getProviderForNetwork')
      .mockImplementation(() => {
        return {
          getApiP: () => {
            return {
              getTxStatus: getTxStatusMockFn
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
    jest.spyOn(WalletService, 'createExportPTx').mockImplementation(() => {
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

    it('should fail if pChainBalance is less than required amount', async () => {
      await expect(async () => {
        await exportP({
          pChainBalance: Avax.fromBase(12),
          requiredAmount: Avax.fromBase(13),
          isDevMode: false,
          activeAccount: {} as Account
        })
      }).rejects.toThrow('Not enough balance on P chain')
    })

    it('should call walletService.createExportPTx', async () => {
      await expect(async () => {
        await exportP({
          pChainBalance: Avax.fromBase(12),
          requiredAmount: Avax.fromBase(10),
          isDevMode: false,
          activeAccount: {} as Account
        })
        expect(WalletService.createExportPTx).toHaveBeenCalledWith({
          amount: BigInt(10000000000),
          accountIndex: undefined,
          avaxXPNetwork: AVALANCHE_XP_NETWORK,
          destinationChain: 'C',
          destinationAddress: undefined
        })
      }).not.toThrow()
    })

    it('should call walletService.signAvaxTx', async () => {
      await expect(async () => {
        await exportP({
          pChainBalance: Avax.fromBase(12),
          requiredAmount: Avax.fromBase(10),
          isDevMode: false,
          activeAccount: {} as Account
        })
        expect(WalletService.sign).toHaveBeenCalled()
      }).not.toThrow()
    })

    it('should call networkService.sendTransaction', async () => {
      await expect(async () => {
        await exportP({
          pChainBalance: Avax.fromBase(12),
          requiredAmount: Avax.fromBase(10),
          isDevMode: false,
          activeAccount: {} as Account
        })
        expect(NetworkService.sendTransaction).toHaveBeenCalled()
      }).not.toThrow()
    })
  })
})
