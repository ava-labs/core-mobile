import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletConnectService from 'services/walletconnectv2/WalletConnectService'
import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  SolanaCaip2ChainId
} from '@avalabs/core-chains-sdk'
import mockAccounts from 'tests/fixtures/accounts.json'
import { AppListenerEffectAPI } from 'store/types'
import { RpcMethod, RpcProvider } from '../../types'
import { walletConnectProvider } from './walletConnect'

jest.mock('services/analytics/AnalyticsService')
jest.mock('services/walletconnectv2/WalletConnectService')
jest.mock('expo-router')

jest.mock('new/common/utils/toast', () => ({
  transactionSnackbar: {
    pending: jest.fn(),
    success: jest.fn(),
    error: jest.fn()
  }
}))

const mockActiveAccount = mockAccounts[0]
jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectActiveAccount: () => mockActiveAccount
  }
})

jest.mock('store/network/slice', () => {
  const actual = jest.requireActual('store/network/slice')
  return {
    ...actual,
    selectActiveNetwork: () => ({ chainId: 1 })
  }
})

const mockListenerApi = {
  getState: jest.fn().mockReturnValue({})
} as unknown as AppListenerEffectAPI

const makeMockRequest = (
  method: RpcMethod,
  chainId: string
): Parameters<typeof walletConnectProvider.onSuccess>[0]['request'] => ({
  method,
  data: {
    id: 1,
    topic: 'test-topic',
    params: {
      request: { method, params: {} },
      chainId
    }
  },
  peerMeta: {
    name: 'Test Dapp',
    description: 'Test dapp',
    url: 'https://test.dapp.com',
    icons: []
  },
  provider: RpcProvider.WALLET_CONNECT
})

describe('walletConnectProvider', () => {
  beforeEach(() => {
    jest
      .spyOn(WalletConnectService, 'approveRequest')
      .mockResolvedValue(undefined)
    jest
      .spyOn(WalletConnectService, 'approveSession')
      .mockResolvedValue({} as never)
  })

  describe('onSuccess — analytics', () => {
    describe('_success events', () => {
      it('fires eth_sendTransaction_success with EVM address', async () => {
        const request = makeMockRequest(
          RpcMethod.ETH_SEND_TRANSACTION,
          'eip155:1'
        )

        await walletConnectProvider.onSuccess({
          request,
          result: '0xdeadbeef',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
          'eth_sendTransaction_success',
          {
            dAppUrl: 'https://test.dapp.com',
            address: mockActiveAccount.addressC,
            chainId: 1,
            txHash: '0xdeadbeef'
          }
        )
      })

      it('fires avalanche_sendTransaction_success with C-chain EVM address', async () => {
        const request = makeMockRequest(
          RpcMethod.AVALANCHE_SEND_TRANSACTION,
          AvalancheCaip2ChainId.C
        )

        await walletConnectProvider.onSuccess({
          request,
          result: '0xcafebabe',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
          'avalanche_sendTransaction_success',
          expect.objectContaining({
            dAppUrl: 'https://test.dapp.com',
            address: mockActiveAccount.addressC,
            txHash: '0xcafebabe'
          })
        )
      })

      it('fires avalanche_sendTransaction_success with P-chain address', async () => {
        const request = makeMockRequest(
          RpcMethod.AVALANCHE_SEND_TRANSACTION,
          AvalancheCaip2ChainId.P
        )

        await walletConnectProvider.onSuccess({
          request,
          result: '0xpchain',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
          'avalanche_sendTransaction_success',
          expect.objectContaining({
            address: mockActiveAccount.addressPVM
          })
        )
      })

      it('fires avalanche_sendTransaction_success with X-chain address', async () => {
        const request = makeMockRequest(
          RpcMethod.AVALANCHE_SEND_TRANSACTION,
          AvalancheCaip2ChainId.X
        )

        await walletConnectProvider.onSuccess({
          request,
          result: '0xxchain',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
          'avalanche_sendTransaction_success',
          expect.objectContaining({
            address: mockActiveAccount.addressAVM
          })
        )
      })

      it('fires bitcoin_sendTransaction_success with BTC address', async () => {
        const request = makeMockRequest(
          RpcMethod.BITCOIN_SEND_TRANSACTION,
          BitcoinCaip2ChainId.MAINNET
        )

        await walletConnectProvider.onSuccess({
          request,
          result: 'btctxhash123',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
          'bitcoin_sendTransaction_success',
          expect.objectContaining({
            dAppUrl: 'https://test.dapp.com',
            address: mockActiveAccount.addressBTC,
            txHash: 'btctxhash123'
          })
        )
      })

      it('fires solana_signAndSendTransaction_success with SVM address', async () => {
        const request = makeMockRequest(
          RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION,
          SolanaCaip2ChainId.MAINNET
        )

        await walletConnectProvider.onSuccess({
          request,
          result: 'solanatxhash456',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
          'solana_signAndSendTransaction_success',
          expect.objectContaining({
            dAppUrl: 'https://test.dapp.com',
            address: mockActiveAccount.addressSVM,
            txHash: 'solanatxhash456'
          })
        )
      })

      it('uses empty string for txHash when result is not a string', async () => {
        const request = makeMockRequest(
          RpcMethod.ETH_SEND_TRANSACTION,
          'eip155:1'
        )

        await walletConnectProvider.onSuccess({
          request,
          result: { someObject: true },
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
          'eth_sendTransaction_success',
          expect.objectContaining({ txHash: '' })
        )
      })
    })

    describe('non-tx-send methods', () => {
      it('does not fire analytics for personal_sign', async () => {
        const request = makeMockRequest(RpcMethod.PERSONAL_SIGN, 'eip155:1')

        await walletConnectProvider.onSuccess({
          request,
          result: '0xsignature',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).not.toHaveBeenCalled()
      })

      it('does not fire analytics for eth_signTypedData_v4', async () => {
        const request = makeMockRequest(
          RpcMethod.SIGN_TYPED_DATA_V4,
          'eip155:1'
        )

        await walletConnectProvider.onSuccess({
          request,
          result: '0xsignature',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).not.toHaveBeenCalled()
      })

      it('does not fire analytics for solana_signTransaction', async () => {
        const request = makeMockRequest(
          RpcMethod.SOLANA_SIGN_TRANSACTION,
          SolanaCaip2ChainId.MAINNET
        )

        await walletConnectProvider.onSuccess({
          request,
          result: 'signedTx',
          listenerApi: mockListenerApi
        })

        expect(AnalyticsService.captureWithEncryption).not.toHaveBeenCalled()
      })
    })

    describe('Solana result wrapping (transformResult)', () => {
      it('wraps solana_signMessage result as { signature }', async () => {
        const request = makeMockRequest(
          RpcMethod.SOLANA_SIGN_MESSAGE,
          SolanaCaip2ChainId.MAINNET
        )

        await walletConnectProvider.onSuccess({
          request,
          result: 'signatureBytes',
          listenerApi: mockListenerApi
        })

        expect(WalletConnectService.approveRequest).toHaveBeenCalledWith(
          'test-topic',
          1,
          { signature: 'signatureBytes' }
        )
      })

      it('wraps solana_signTransaction result as { transaction }', async () => {
        const request = makeMockRequest(
          RpcMethod.SOLANA_SIGN_TRANSACTION,
          SolanaCaip2ChainId.MAINNET
        )

        await walletConnectProvider.onSuccess({
          request,
          result: 'serializedTx',
          listenerApi: mockListenerApi
        })

        expect(WalletConnectService.approveRequest).toHaveBeenCalledWith(
          'test-topic',
          1,
          { transaction: 'serializedTx' }
        )
      })

      it('passes through result unchanged for non-Solana methods', async () => {
        const request = makeMockRequest(
          RpcMethod.ETH_SEND_TRANSACTION,
          'eip155:1'
        )

        await walletConnectProvider.onSuccess({
          request,
          result: '0xtxhash',
          listenerApi: mockListenerApi
        })

        expect(WalletConnectService.approveRequest).toHaveBeenCalledWith(
          'test-topic',
          1,
          '0xtxhash'
        )
      })
    })
  })
})
