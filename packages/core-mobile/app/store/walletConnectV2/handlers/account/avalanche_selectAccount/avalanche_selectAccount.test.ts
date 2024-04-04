import { ethErrors } from 'eth-rpc-errors'
import { RpcMethod } from 'store/walletConnectV2'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import AppNavigation from 'navigation/AppNavigation'
import * as Navigation from 'utils/Navigation'
import { setActiveAccountIndex } from 'store/account'
import { avalancheSelectAccountHandler as handler } from './avalanche_selectAccount'

jest.mock('store/account', () => {
  const actual = jest.requireActual('store/account')
  return {
    ...actual,
    selectAccounts: () => mockAccounts,
    selectActiveAccount: () => mockAccounts[0]
  }
})

const mockNavigate = jest.fn()
jest.spyOn(Navigation, 'navigate').mockImplementation(mockNavigate)

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const testMethod =
  'avalanche_selectAccount' as RpcMethod.AVALANCHE_SELECT_ACCOUNT

const createRequest = (params: unknown) => {
  return {
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
    session: mockSession
  }
}

const testHandleInvalidParams = async (params: unknown) => {
  const testRequest = createRequest(params)

  const result = await handler.handle(testRequest, mockListenerApi)

  expect(result).toEqual({
    success: false,
    error: ethErrors.rpc.invalidParams({
      message: 'Account index is invalid'
    })
  })
}

const testApproveInvalidData = async (data: unknown) => {
  const testRequest = createRequest([0])

  const result = await handler.approve(
    { request: testRequest, data },
    mockListenerApi
  )

  expect(result).toEqual({
    success: false,
    error: ethErrors.rpc.internal('Invalid approve data')
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
      const testRequest = createRequest([0])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({ success: true, value: null })
    })

    it('should return error when requested account does not exist', async () => {
      const testRequest = createRequest([22])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.resourceNotFound({
          message: 'Requested account does not exist'
        })
      })
    })

    it('should display prompt and return success', async () => {
      const testRequest = createRequest([1])

      const result = await handler.handle(testRequest, mockListenerApi)

      expect(mockNavigate).toHaveBeenCalledWith({
        name: AppNavigation.Root.Wallet,
        params: {
          screen: AppNavigation.Modal.SelectAccountV2,
          params: {
            request: testRequest,
            account: mockAccounts[1]
          }
        }
      })

      expect(result).toEqual({ success: true, value: expect.any(Symbol) })
    })
  })

  describe('approve', () => {
    it('should return error when approve data is invalid', async () => {
      const invalidDataScenarios = [
        null,
        {},
        { account: null },
        { account: { address: '0x3B0d3329ec01047F1A03CcA8106f2915AdFDC3dD' } }
      ]

      for (const scenario of invalidDataScenarios) {
        await testApproveInvalidData(scenario)
      }
    })

    it('should set requested account to active and return success', async () => {
      const testRequest = createRequest([1])
      const requestedAccount = mockAccounts[1]

      const result = await handler.approve(
        { request: testRequest, data: { account: requestedAccount } },
        mockListenerApi
      )

      expect(mockDispatch).toHaveBeenCalledWith(setActiveAccountIndex(1))

      expect(result).toEqual({ success: true, value: [] })
    })
  })
})
