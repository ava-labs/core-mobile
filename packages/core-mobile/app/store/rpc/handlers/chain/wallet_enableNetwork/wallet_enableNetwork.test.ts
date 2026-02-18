import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockNetworks from 'tests/fixtures/networks.json'
import * as NetworkSlice from 'store/network/slice'
import { walletEnableNetworkHandler as handler } from './wallet_enableNetwork'

const mockAllNetworks = jest.fn()
const mockEnabledChainIds = jest.fn()

jest
  .spyOn(NetworkSlice, 'selectAllNetworks')
  .mockImplementation(mockAllNetworks)

jest
  .spyOn(NetworkSlice, 'selectEnabledChainIds')
  .mockImplementation(mockEnabledChainIds)

const mockDispatch = jest.fn()
const mockGetState = jest.fn()

const mockListenerApi = {
  getState: mockGetState,
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = RpcMethod.WALLET_ENABLE_NETWORK

const createRequest = (
  params?: unknown
): RpcRequest<RpcMethod.WALLET_ENABLE_NETWORK> => {
  return {
    provider: RpcProvider.WALLET_CONNECT,
    method: testMethod,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: testMethod,
          params
        },
        chainId: 'eip155:43114'
      }
    },
    peerMeta: mockSession.peer.metadata
  }
}

describe('wallet_enableNetwork handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetState.mockReturnValue({})
  })

  describe('handle', () => {
    it('should return error when chainId param is missing', async () => {
      const testRequest = createRequest(undefined)
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Missing parameter: chainId')
      })
    })

    it('should return error when chainId is not a number', async () => {
      const testRequest = createRequest({ chainId: 'not-a-number' })
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Missing parameter: chainId')
      })
    })

    it('should return error when network is unknown', async () => {
      mockAllNetworks.mockReturnValue({})
      const testRequest = createRequest({ chainId: 99999 })
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Unsupported chain id: 99999')
      })
    })

    it('should enable network and return updated enabled chain IDs (object form)', async () => {
      mockAllNetworks.mockReturnValue(mockNetworks)
      mockEnabledChainIds
        .mockReturnValueOnce([43114]) // before enabling
        .mockReturnValueOnce([43114, 1]) // after enabling

      const testRequest = createRequest({ chainId: 1 })
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(mockDispatch).toHaveBeenCalledWith(
        NetworkSlice.toggleEnabledChainId(1)
      )
      expect(result).toEqual({
        success: true,
        value: [43114, 1]
      })
    })

    it('should enable network and return updated enabled chain IDs (tuple form)', async () => {
      mockAllNetworks.mockReturnValue(mockNetworks)
      mockEnabledChainIds
        .mockReturnValueOnce([43114]) // before enabling
        .mockReturnValueOnce([43114, 1]) // after enabling

      const testRequest = createRequest([{ chainId: 1 }])
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(mockDispatch).toHaveBeenCalledWith(
        NetworkSlice.toggleEnabledChainId(1)
      )
      expect(result).toEqual({
        success: true,
        value: [43114, 1]
      })
    })

    it('should not dispatch if network is already enabled', async () => {
      mockAllNetworks.mockReturnValue(mockNetworks)
      mockEnabledChainIds.mockReturnValue([43114, 1])

      const testRequest = createRequest([{ chainId: 1 }])
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(mockDispatch).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: true,
        value: [43114, 1]
      })
    })
  })
})
