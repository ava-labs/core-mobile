import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockWallets from 'tests/fixtures/wallets.json'
import { setActiveAccount } from 'store/account/thunks'
import { avalancheSelectAccountHandler as handler } from './avalanche_selectAccount'

jest.mock('store/account/thunks', () => ({
  setActiveAccount: jest.fn()
}))

jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectAccounts: () => mockAccounts,
    selectActiveAccount: () => mockAccounts['0']
  }
})

const mockDispatch = jest.fn(() => ({
  unwrap: jest.fn(() => Promise.resolve())
}))
const mockListenerApi = {
  getState: jest.fn(() => ({
    wallet: {
      wallets: mockWallets,
      activeWalletId: 'wallet-1'
    },
    account: {
      accounts: mockAccounts
    }
  })),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod = RpcMethod.AVALANCHE_SELECT_ACCOUNT

const createRequest = (
  params: unknown
): RpcRequest<RpcMethod.AVALANCHE_SELECT_ACCOUNT> => {
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
        chainId: 'eip155:43113'
      }
    },
    peerMeta: mockSession.peer.metadata
  }
}

const testHandleInvalidParams = async (params: unknown) => {
  const testRequest = createRequest(params)

  const result = await handler.handle(testRequest, mockListenerApi)

  expect(result).toEqual({
    success: false,
    error: rpcErrors.invalidParams('Account id is invalid')
  })
}

describe('avalanche_selectAccount handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['avalanche_selectAccount'])
  })

  describe('handle', () => {
    it('should return error when params are invalid', async () => {
      const invalidParamsScenarios = [null, [], [null], [-1]]

      for (const scenario of invalidParamsScenarios) {
        await testHandleInvalidParams(scenario)
      }
    })

    it('should return success when requested account is already active', async () => {
      const testRequest = createRequest(['0'])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({ success: true, value: null })
    })

    it('should return error when requested account does not exist', async () => {
      const testRequest = createRequest(['2'])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.resourceNotFound('Requested account does not exist')
      })
    })

    it('should set requested account to active and return success', async () => {
      const testRequest = createRequest(['1'])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(setActiveAccount).toHaveBeenCalledWith('1')

      expect(result).toEqual({ success: true, value: [] })
    })
  })
})
