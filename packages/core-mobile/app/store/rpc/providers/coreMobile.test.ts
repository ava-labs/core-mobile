import AnalyticsService from 'services/analytics/AnalyticsService'
import mockAccounts from 'tests/fixtures/accounts.json'
import { AppListenerEffectAPI } from 'store/types'
import { onInAppRequestSucceeded } from '../slice'
import { CORE_MOBILE_META, RpcMethod, RpcProvider } from '../types'
import { coreMobileProvider } from './coreMobile'

jest.mock('services/analytics/AnalyticsService')

const mockActiveAccount = mockAccounts[0]
jest.mock('store/account', () => {
  const actual = jest.requireActual('store/account')
  return {
    ...actual,
    selectActiveAccount: () => mockActiveAccount
  }
})

const mockDispatch = jest.fn()
const mockListenerApi = {
  dispatch: mockDispatch,
  getState: jest.fn().mockReturnValue({})
} as unknown as AppListenerEffectAPI

const makeMockRequest = ({
  method = RpcMethod.ETH_SEND_TRANSACTION,
  chainId = 'eip155:1',
  url = 'https://test.dapp.com'
}: {
  method?: RpcMethod
  chainId?: string
  url?: string
}) => ({
  method,
  data: {
    id: 1,
    topic: 'core-mobile-topic',
    params: {
      request: { method, params: {} },
      chainId
    }
  },
  peerMeta: {
    name: url === CORE_MOBILE_META.url ? 'Core' : 'Test dapp',
    description: 'Test dapp',
    url,
    icons: []
  },
  provider: RpcProvider.CORE_MOBILE
})

describe('coreMobileProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fires eth_sendTransaction_success for browser-originated dapp requests', async () => {
    const request = makeMockRequest({})

    await coreMobileProvider.onSuccess({
      request,
      result: '0xdeadbeef',
      listenerApi: mockListenerApi
    })

    expect(AnalyticsService.captureWithEncryption).toHaveBeenCalledWith(
      'eth_sendTransaction_success',
      {
        dAppUrl: 'https://test.dapp.com',
        address: mockActiveAccount.addressC,
        chainId: 'eip155:1',
        txHash: '0xdeadbeef'
      }
    )
    expect(mockDispatch).toHaveBeenCalledWith(
      onInAppRequestSucceeded({ requestId: 1, txHash: '0xdeadbeef' })
    )
  })

  it('does not fire dapp analytics for Core internal in-app requests', async () => {
    const request = makeMockRequest({ url: CORE_MOBILE_META.url })

    await coreMobileProvider.onSuccess({
      request,
      result: '0xdeadbeef',
      listenerApi: mockListenerApi
    })

    expect(AnalyticsService.captureWithEncryption).not.toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(
      onInAppRequestSucceeded({ requestId: 1, txHash: '0xdeadbeef' })
    )
  })
})
