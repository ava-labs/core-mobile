import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId
} from '@avalabs/core-chains-sdk'
import mockAccounts from 'tests/fixtures/accounts.json'
import { AppListenerEffectAPI } from 'store/types'
import { CORE_MOBILE_META, PeerMeta, RpcMethod, RpcProvider } from '../types'
import { coreMobileProvider } from './coreMobile'

jest.mock('services/analytics/AnalyticsService')

const mockActiveAccount = mockAccounts[0]
jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectActiveAccount: () => mockActiveAccount
  }
})

const mockListenerApi = {
  dispatch: jest.fn(),
  getState: jest.fn().mockReturnValue({})
} as unknown as AppListenerEffectAPI

const DEFAULT_PEER_META: PeerMeta = {
  name: 'Test Dapp',
  description: 'Test dapp',
  url: 'https://test.dapp.com',
  icons: []
}

const makeMockRequest = (
  method: RpcMethod,
  chainId: string,
  {
    peerMeta = DEFAULT_PEER_META,
    params = {}
  }: { peerMeta?: PeerMeta; params?: unknown } = {}
): Parameters<typeof coreMobileProvider.onSuccess>[0]['request'] => ({
  method,
  data: {
    id: 1,
    topic: 'core-mobile-topic',
    params: {
      request: { method, params },
      chainId
    }
  },
  peerMeta,
  provider: RpcProvider.CORE_MOBILE
})

describe('coreMobileProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('onSuccess — MTU analytics (CP-13825)', () => {
    it('fires eth_sendTransaction_success for an injected dApp request', async () => {
      const request = makeMockRequest(
        RpcMethod.ETH_SEND_TRANSACTION,
        'eip155:1'
      )

      await coreMobileProvider.onSuccess({
        request,
        result: '0xdeadbeef',
        listenerApi: mockListenerApi
      })

      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'eth_sendTransaction_success',
        {
          encrypted: {
            dAppUrl: 'https://test.dapp.com',
            address: mockActiveAccount.addressC,
            chainId: 'eip155:1',
            txHash: '0xdeadbeef'
          }
        }
      )
    })

    it('uses the tx `from` as the address, not the active account (granted non-active signer)', async () => {
      const NON_ACTIVE_FROM = '0xAAAA000000000000000000000000000000000001'
      const request = makeMockRequest(
        RpcMethod.ETH_SEND_TRANSACTION,
        'eip155:1',
        { params: [{ from: NON_ACTIVE_FROM, to: '0xbbbb', value: '0x0' }] }
      )

      await coreMobileProvider.onSuccess({
        request,
        result: '0xdeadbeef',
        listenerApi: mockListenerApi
      })

      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'eth_sendTransaction_success',
        { encrypted: expect.objectContaining({ address: NON_ACTIVE_FROM }) }
      )
    })

    it('falls back to the active account when the tx `from` is missing', async () => {
      const request = makeMockRequest(
        RpcMethod.ETH_SEND_TRANSACTION,
        'eip155:1',
        { params: [{ to: '0xbbbb', value: '0x0' }] }
      )

      await coreMobileProvider.onSuccess({
        request,
        result: '0xdeadbeef',
        listenerApi: mockListenerApi
      })

      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'eth_sendTransaction_success',
        {
          encrypted: expect.objectContaining({
            address: mockActiveAccount.addressC
          })
        }
      )
    })

    it('resolves the correct address per chain', async () => {
      await coreMobileProvider.onSuccess({
        request: makeMockRequest(
          RpcMethod.AVALANCHE_SEND_TRANSACTION,
          AvalancheCaip2ChainId.P
        ),
        result: '0xpchain',
        listenerApi: mockListenerApi
      })
      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'avalanche_sendTransaction_success',
        {
          encrypted: expect.objectContaining({
            address: mockActiveAccount.addressPVM
          })
        }
      )

      await coreMobileProvider.onSuccess({
        request: makeMockRequest(
          RpcMethod.BITCOIN_SEND_TRANSACTION,
          BitcoinCaip2ChainId.MAINNET
        ),
        result: 'btchash',
        listenerApi: mockListenerApi
      })
      expect(AnalyticsService.capture).toHaveBeenCalledWith(
        'bitcoin_sendTransaction_success',
        {
          encrypted: expect.objectContaining({
            address: mockActiveAccount.addressBTC
          })
        }
      )
    })

    it('does NOT fire for a wallet-internal request (CORE_MOBILE_META)', async () => {
      const request = makeMockRequest(
        RpcMethod.ETH_SEND_TRANSACTION,
        'eip155:1',
        { peerMeta: CORE_MOBILE_META }
      )

      await coreMobileProvider.onSuccess({
        request,
        result: '0xdeadbeef',
        listenerApi: mockListenerApi
      })

      expect(AnalyticsService.capture).not.toHaveBeenCalled()
    })

    it('does NOT fire for an empty-url peerMeta (getPeerMeta placeholder)', async () => {
      const request = makeMockRequest(
        RpcMethod.ETH_SEND_TRANSACTION,
        'eip155:1',
        {
          peerMeta: {
            name: 'Unknown site',
            description: '',
            url: '',
            icons: []
          }
        }
      )

      await coreMobileProvider.onSuccess({
        request,
        result: '0xdeadbeef',
        listenerApi: mockListenerApi
      })

      expect(AnalyticsService.capture).not.toHaveBeenCalled()
    })

    it('does NOT fire for a non-tx-send method', async () => {
      const request = makeMockRequest(RpcMethod.ETH_SIGN, 'eip155:1')

      await coreMobileProvider.onSuccess({
        request,
        result: '0xsignature',
        listenerApi: mockListenerApi
      })

      expect(AnalyticsService.capture).not.toHaveBeenCalled()
    })

    it('does NOT fire when the result is not a non-empty string (no txHash)', async () => {
      await coreMobileProvider.onSuccess({
        request: makeMockRequest(RpcMethod.ETH_SEND_TRANSACTION, 'eip155:1'),
        result: '',
        listenerApi: mockListenerApi
      })
      await coreMobileProvider.onSuccess({
        request: makeMockRequest(RpcMethod.ETH_SEND_TRANSACTION, 'eip155:1'),
        result: undefined,
        listenerApi: mockListenerApi
      })

      expect(AnalyticsService.capture).not.toHaveBeenCalled()
    })

    it('still dispatches onInAppRequestSucceeded regardless of analytics', async () => {
      await coreMobileProvider.onSuccess({
        request: makeMockRequest(RpcMethod.ETH_SEND_TRANSACTION, 'eip155:1', {
          peerMeta: CORE_MOBILE_META
        }),
        result: '0xdeadbeef',
        listenerApi: mockListenerApi
      })

      expect(mockListenerApi.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { requestId: 1, txHash: '0xdeadbeef' }
        })
      )
    })
  })
})
