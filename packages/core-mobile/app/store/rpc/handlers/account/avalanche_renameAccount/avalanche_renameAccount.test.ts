import { rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockWallets from 'tests/fixtures/wallets.json'
import { avalancheRenameAccountHandler as handler } from './avalanche_renameAccount'

jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectAccounts: () => mockAccounts
  }
})

const mockDispatch = jest.fn()
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

const createRequest = (
  params: unknown
): RpcRequest<RpcMethod.AVALANCHE_RENAME_ACCOUNT> => {
  return {
    provider: RpcProvider.WALLET_CONNECT,
    method: RpcMethod.AVALANCHE_RENAME_ACCOUNT,
    data: {
      id: 1677366383831712,
      topic: '3a094bf511357e0f48ff266f0b8d5b846fd3f7de4bd0824d976fdf4c5279b261',
      params: {
        request: {
          method: RpcMethod.AVALANCHE_RENAME_ACCOUNT,
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

describe('avalanche_renameAccount handler', () => {
  it('should contain correct methods', () => {
    expect(handler.methods).toEqual(['avalanche_renameAccount'])
  })

  describe('handle', () => {
    it('should return error when params are invalid', async () => {
      const invalidParamsScenarios = [null, [], [null], [1234, 'title']]

      for (const scenario of invalidParamsScenarios) {
        await testHandleInvalidParams(scenario)
      }
    })

    it('should return success when requested account is already active', async () => {
      const testRequest = createRequest(['0', 'new title'])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({ success: true, value: [] })
    })

    it('should return error when requested account does not exist', async () => {
      const testRequest = createRequest(['2', 'new title'])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.resourceNotFound('Requested account does not exist')
      })
    })

    it('should return error when new account name is an empty string', async () => {
      const testRequest = createRequest(['1', ''])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Invalid new name')
      })
    })

    it('should return error when renaming account fails', async () => {
      mockDispatch.mockImplementationOnce(() => {
        throw new Error('some error')
      })

      const testRequest = createRequest(['0', 'new title'])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.internal('Account renaming failed')
      })
    })
  })
})
