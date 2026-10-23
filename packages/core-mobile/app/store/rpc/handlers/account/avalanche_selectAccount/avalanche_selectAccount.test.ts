import { providerErrors, rpcErrors } from '@metamask/rpc-errors'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import mockWallets from 'tests/fixtures/wallets.json'
import { setActiveAccount } from 'store/account/thunks'
import { VerifyContext } from 'store/rpc/handlers/wc_sessionRequest/utils'
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

const verifiedCoreContext = {
  verified: { origin: 'https://core.app', validation: 'VALID', verifyUrl: '' }
} as VerifyContext

const createRequest = (
  params: unknown,
  options: { provider?: RpcProvider; verifyContext?: VerifyContext } = {}
): RpcRequest<RpcMethod.AVALANCHE_SELECT_ACCOUNT> => {
  return {
    provider: options.provider ?? RpcProvider.WALLET_CONNECT,
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
      },
      verifyContext:
        'verifyContext' in options ? options.verifyContext : verifiedCoreContext
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
    beforeEach(() => {
      jest.clearAllMocks()
    })

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

    it('switches for a verified Core domain over WalletConnect', async () => {
      const result = await handler.handle(createRequest(['1']), mockListenerApi)

      expect(setActiveAccount).toHaveBeenCalledWith('1')
      expect(result).toEqual({ success: true, value: [] })
    })

    it('rejects an unverified WalletConnect request without switching', async () => {
      const unverified = {
        verified: {
          origin: 'https://core.app',
          validation: 'UNKNOWN',
          verifyUrl: ''
        }
      } as VerifyContext

      for (const verifyContext of [unverified, undefined]) {
        const result = await handler.handle(
          createRequest(['1'], { verifyContext }),
          mockListenerApi
        )

        expect(result).toEqual({
          success: false,
          error: providerErrors.unauthorized(
            'Request is not from a verified Core domain'
          )
        })
      }
      expect(setActiveAccount).not.toHaveBeenCalled()
      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it('switches for an in-app request without a verify context', async () => {
      const result = await handler.handle(
        createRequest(['1'], {
          provider: RpcProvider.CORE_MOBILE,
          verifyContext: undefined
        }),
        mockListenerApi
      )

      expect(setActiveAccount).toHaveBeenCalledWith('1')
      expect(result).toEqual({ success: true, value: [] })
    })
  })
})
