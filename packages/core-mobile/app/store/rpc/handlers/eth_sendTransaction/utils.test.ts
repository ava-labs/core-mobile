import { RpcMethod, RpcProvider } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import * as Navigation from 'utils/Navigation'
import { getChainIdFromRequest } from './utils'
import { EthSendTransactionRpcRequest } from './eth_sendTransaction'

const mockNavigate = jest.fn()
jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

const createRequest = (chainId: string): EthSendTransactionRpcRequest => {
  const testMethod = RpcMethod.ETH_SEND_TRANSACTION
  return {
    provider: RpcProvider.WALLET_CONNECT,
    method: testMethod,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: testMethod,
          params: {}
        },
        chainId
      }
    },
    peerMeta: mockSession.peer.metadata
  }
}

describe('eth_sendTransaction utils', () => {
  describe('getChainIdFromRequest', () => {
    it('should throw an error if chainId is missing from the request', () => {
      const request = createRequest('')
      expect(() => getChainIdFromRequest(request)).toThrow(
        'chainId is missing from the request'
      )
    })

    it('should throw an error if chainId is not in a valid format', () => {
      const request = createRequest('ethereum')
      expect(() => getChainIdFromRequest(request)).toThrow(
        'chainId is not in a valid format'
      )
    })

    it('should return the chainId from the request', () => {
      const request = createRequest('ethereum:1')
      expect(getChainIdFromRequest(request)).toBe(1)
    })
  })
})
