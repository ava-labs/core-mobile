import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import { avalancheGetAccountsHandler as handler } from './avalanche_getAccounts'

jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectAccounts: () => mockAccounts,
    selectActiveAccount: () => mockAccounts[0]
  }
})

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = RpcMethod.AVALANCHE_GET_ACCOUNTS

const testRequest: RpcRequest<RpcMethod.AVALANCHE_GET_ACCOUNTS> = {
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

describe('avalanche_getAccounts handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['avalanche_getAccounts'])
  })

  describe('handle', () => {
    it('should return success with the list of available accounts', async () => {
      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: true,
        value: [
          {
            id: '0',
            index: 0,
            name: 'Account 1',
            addressAVM: 'X-fuji1e0r9s2lf6v9mfqyy6pxrpkar8dm5jxqcvhg99n',
            addressBTC: 'tb1qlzsvluv4cahzz8zzwud40x2hn3zq4c7zak6spw',
            addressC: '0xcA0E993876152ccA6053eeDFC753092c8cE712D0',
            addressPVM: 'P-fuji1e0r9s2lf6v9mfqyy6pxrpkar8dm5jxqcvhg99n',
            addressCoreEth: 'C-fuji1y76a8lk4ym3af4u45f7fghuqc6ftfh7l4jsrgz',
            active: true,
            type: 'primary',
            walletId: '0',
            walletType: 'mnemonic'
          },
          {
            id: '1',
            index: 1,
            name: 'Account 2',
            addressBTC: 'tb1qjmapax0vtca726g8kaermd5rzdljql66esxs49',
            addressC: '0xC7E5ffBd7843EdB88cCB2ebaECAa07EC55c65318',
            addressAVM: '',
            addressPVM: '',
            addressCoreEth: '',
            active: false,
            type: 'primary',
            walletId: '0',
            walletType: 'mnemonic'
          }
        ]
      })
    })
  })
})
