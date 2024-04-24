import { ethErrors } from 'eth-rpc-errors'
import * as Navigation from 'utils/Navigation'
import { DEFERRED_RESULT } from 'store/rpc/handlers/types'
import { RpcMethod, RpcProvider } from 'store/rpc'
import {
  AvalancheSignMessageRpcRequest,
  avalancheSignMessageHandler
} from './avalanche_signMessage'

jest.mock('store/settings/advanced')
jest.mock('utils/Navigation')
const mockNavigate = jest.fn()

const mockIsDeveloperMode = true
jest.mock('store/settings/advanced', () => {
  const actual = jest.requireActual('store/settings/advanced')
  return {
    ...actual,
    selectIsDeveloperMode: () => mockIsDeveloperMode
  }
})

const createRequest = (params: unknown): AvalancheSignMessageRpcRequest => {
  return {
    method: RpcMethod.AVALANCHE_SIGN_MESSAGE,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: RpcMethod.AVALANCHE_SIGN_MESSAGE,
          params
        },
        chainId: 'eip155:43114'
      }
    },
    peerMeta: {
      name: 'Avalanche Wallet',
      description: 'Avalanche Wallet',
      url: 'https://wallet.avax.network/',
      icons: []
    },
    provider: RpcProvider.CORE_MOBILE
  }
}

describe('avalanche_signMessage', () => {
  const mockDispatch = jest.fn()
  const mockListenerApi = {
    getState: jest.fn(),
    dispatch: mockDispatch
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)
  })

  describe('handle', () => {
    it('returns error for invalid params', async () => {
      const requests = [
        createRequest([]),
        createRequest(['test', '0']),
        createRequest(['test', -1]),
        createRequest([0, 'test']),
        createRequest([0, -1]),
        createRequest([0])
      ]

      for (const request of requests) {
        const result = await avalancheSignMessageHandler.handle(
          request,
          mockListenerApi
        )
        expect(result).toEqual({
          success: false,
          error: ethErrors.rpc.invalidParams({
            message: 'avalanche_signMessage param is invalid'
          })
        })
      }
    })

    it('returns result and navigate for valid params', async () => {
      const requests = [createRequest(['test']), createRequest(['test', 0])]

      for (const request of requests) {
        const result = await avalancheSignMessageHandler.handle(
          request,
          mockListenerApi
        )
        expect(result).toEqual({
          success: true,
          value: DEFERRED_RESULT
        })
        expect(mockNavigate).toHaveBeenCalledWith({
          name: 'Root.Wallet',
          params: {
            screen: 'ModalScreens.AvalancheSignMessage',
            params: { request, data: { message: '74657374', accountIndex: 0 } }
          }
        })
      }
    })
  })
})
