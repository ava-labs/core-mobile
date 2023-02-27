import { RpcMethod } from 'store/walletConnectV2'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import { avalancheGetAccountsHandler as handler } from './avalanche_getAccounts'

jest.mock('store/account', () => {
  const actual = jest.requireActual('store/account')
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

const testMethod = 'avalanche_getAccounts' as RpcMethod.AVALANCHE_GET_ACCOUNTS

const testRequest = {
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
  session: mockSession
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
            index: 0,
            name: 'Account 1',
            addressBTC: 'tb1qctnzrtj8k6f362x34t3n09tk0er0eu4cql0fxn',
            addressC: '0x341b0073b66bfc19FCB54308861f604F5Eb8f51b',
            active: true,
            type: 'primary'
          },
          {
            index: 1,
            name: 'Account 2',
            addressBTC: 'tb1qg4h6wsytfmdw7lyn4a8mggqktwrg49gztn0hyd',
            addressC: '0x3B0d3329ec01047F1A03CcA8106f2915AdFDC3dD',
            active: false,
            type: 'primary'
          }
        ]
      })
    })
  })
})
