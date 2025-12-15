import { Account } from 'store/account'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { avaxSerial, EVM, UnsignedTx, utils } from '@avalabs/avalanchejs'
import mockNetworks from 'tests/fixtures/networks.json'
import { Network } from '@avalabs/core-chains-sdk'
import { exportP } from 'services/earn/exportP'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { WalletType } from 'services/wallet/types'
import AvalancheWalletService from 'services/wallet/AvalancheWalletService'

describe('earn/exportP', () => {
  describe('exportP', () => {
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
    jest.spyOn(NetworkService, 'getNetworks').mockImplementation(() => {
      return Promise.resolve(
        mockNetworks as unknown as { [chainId: number]: Network }
      )
    })

    jest.mock('services/wallet/AvalancheWalletService')
    jest
      .spyOn(AvalancheWalletService, 'createExportPTx')
      .mockImplementation(() => {
        return Promise.resolve({ utxos: [] } as unknown as UnsignedTx)
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
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          pChainBalance: new TokenUnit(12 * 10 ** 9, 9, 'AVAX'),
          requiredAmount: new TokenUnit(13 * 10 ** 9, 9, 'AVAX'),
          isTestnet: false,
          account: { xpAddresses: [] } as unknown as Account
        })
      }).rejects.toThrow('Not enough balance on P chain')
    })

    it('should call walletService.createExportPTx', async () => {
      expect(async () => {
        await exportP({
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          pChainBalance: new TokenUnit(12 * 10 ** 9, 9, 'AVAX'),
          requiredAmount: new TokenUnit(10 * 10 ** 9, 9, 'AVAX'),
          isTestnet: false,
          account: { xpAddresses: [] } as unknown as Account
        })
        expect(AvalancheWalletService.createExportPTx).toHaveBeenCalledWith({
          amountInNAvax: BigInt(10000000000),
          account: { xpAddresses: [] } as unknown as Account,
          destinationChain: 'C',
          destinationAddress: undefined,
          feeState: undefined,
          isTestnet: false
        })
      }).not.toThrow()
    })

    it('should call walletService.signAvaxTx', async () => {
      expect(async () => {
        await exportP({
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          pChainBalance: new TokenUnit(12 * 10 ** 9, 9, 'AVAX'),
          requiredAmount: new TokenUnit(10 * 10 ** 9, 9, 'AVAX'),
          isTestnet: false,
          account: { xpAddresses: [] } as unknown as Account
        })
        expect(WalletService.sign).toHaveBeenCalled()
      }).not.toThrow()
    })

    it('should call networkService.sendTransaction', async () => {
      expect(async () => {
        await exportP({
          walletId: 'wallet-1',
          walletType: WalletType.MNEMONIC,
          pChainBalance: new TokenUnit(12 * 10 ** 9, 9, 'AVAX'),
          requiredAmount: new TokenUnit(10 * 10 ** 9, 9, 'AVAX'),
          isTestnet: false,
          account: { xpAddresses: [] } as unknown as Account
        })
        expect(NetworkService.sendTransaction).toHaveBeenCalled()
      }).not.toThrow()
    })
  })
})
