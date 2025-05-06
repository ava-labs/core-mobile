import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockNetworks from 'tests/fixtures/networks.json'
import * as NetworkSlice from 'store/network/slice'
import { walletGetEthereumChainHandler as handler } from './wallet_getEthereumChain'

const mockEnabledNetworks = jest.fn()

jest
  .spyOn(NetworkSlice, 'selectEnabledNetworks')
  .mockImplementation(mockEnabledNetworks)

const mockListenerApi = {
  getState: jest.fn(),
  dispatch: jest.fn()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = RpcMethod.WALLET_GET_ETHEREUM_CHAIN

const createRequest = (): RpcRequest<RpcMethod.WALLET_GET_ETHEREUM_CHAIN> => {
  return {
    provider: RpcProvider.WALLET_CONNECT,
    method: testMethod,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: testMethod,
          params: null
        },
        chainId: 'eip155:43114'
      }
    },
    peerMeta: mockSession.peer.metadata
  }
}

describe('wallet_getEthereumChain handler', () => {
  describe('handle', () => {
    it('should return resource unavailable when there is no c-chain network', async () => {
      mockEnabledNetworks.mockReturnValue([])
      const testRequest = createRequest()
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.resourceUnavailable('no C-Chain network')
      })
    })
    it('should return success with response', async () => {
      mockEnabledNetworks.mockReturnValue([
        mockNetworks[43114],
        mockNetworks[1]
      ])
      const testRequest = createRequest()
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: true,
        value: {
          blockExplorerUrls: ['https://snowtrace.io'],
          chainId: '0xa86a',
          chainName: 'Avalanche (C-Chain)',
          isTestnet: false,
          nativeCurrency: {
            decimals: 18,
            name: 'Avalanche',
            symbol: 'AVAX'
          },
          rpcUrls: ['https://api.avax.network/ext/bc/C/rpc']
        }
      })
    })
  })
})
