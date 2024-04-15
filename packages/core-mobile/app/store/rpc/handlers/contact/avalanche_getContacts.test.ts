import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockContacts from 'tests/fixtures/contacts.json'
import { avalancheGetContactsHandler as handler } from './avalanche_getContacts'

jest.mock('store/addressBook', () => {
  const actual = jest.requireActual('store/addressBook')
  return {
    ...actual,
    selectContacts: () => mockContacts
  }
})

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = RpcMethod.AVALANCHE_GET_CONTACTS

const testRequest: RpcRequest<RpcMethod.AVALANCHE_GET_CONTACTS> = {
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
      chainId: 'eip155:43113'
    }
  },
  peerMeta: mockSession.peer.metadata
}

describe('avalanche_getContacts handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['avalanche_getContacts'])
  })

  describe('handle', () => {
    it('should return success with the list of available contacts', async () => {
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: true,
        value: [
          {
            id: '1aec34f6-308d-4962-ab1b-283504cc0960',
            name: 'Bob',
            addressBTC: 'tb1qjmapax0vtca726g8kaermd5rzdljql66esxs49',
            address: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318'
          },
          {
            id: 'e0949c95-76a1-40ce-90b8-a32198b4dccf',
            name: 'Alice',
            addressBTC: 'tb1qlzsvluv4cahzz8zzwud40x2hn3zq4c7zak6spw',
            address: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0'
          }
        ]
      })
    })
  })
})
