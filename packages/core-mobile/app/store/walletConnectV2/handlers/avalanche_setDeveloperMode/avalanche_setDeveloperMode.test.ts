import { RpcMethod } from 'store/walletConnectV2/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import { ethErrors } from 'eth-rpc-errors'
import {
  AvalancheSetDeveloperModeRpcRequest,
  avalancheSetDeveloperModeHandler
} from './avalanche_setDeveloperMode'

jest.mock('../index')

const createRequest = (
  params: unknown
): AvalancheSetDeveloperModeRpcRequest => {
  return {
    method: RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
    data: {
      id: 1,
      topic: '1',
      params: {
        request: {
          method: RpcMethod.AVALANCHE_SET_DEVELOPER_MODE,
          params
        },
        chainId: 'eip155:43114'
      }
    },
    session: mockSession
  }
}

describe('avalanche_setDeveloperMode.ts', () => {
  describe('handle', () => {
    it('returns error if param is not boolean', async () => {
      const mockListenerApi = {
        getState: () => ({
          settings: { advanced: { developerMode: false } }
        }),
        dispatch: jest.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
      const request = createRequest('1')
      const result = await avalancheSetDeveloperModeHandler.handle(
        request,
        mockListenerApi
      )
      expect(result).toEqual({
        success: false,
        error: ethErrors.rpc.invalidParams({
          message: 'avalanche_setDeveloperMode param is invalid'
        })
      })
    })
    it('returns already on correct developer mode if param is same as current developer mode', async () => {
      const mockListenerApi = {
        getState: () => ({
          settings: { advanced: { developerMode: true } }
        }),
        dispatch: jest.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
      const request = createRequest([true])
      const result = await avalancheSetDeveloperModeHandler.handle(
        request,
        mockListenerApi
      )
      expect(result).toEqual({
        success: true,
        value: 'Developer Mode is already set to true'
      })
    })
    it('should update developer mode and return message developer mode is set to true', async () => {
      const mockListenerApi = {
        getState: () => ({
          settings: { advanced: { developerMode: false } }
        }),
        dispatch: jest.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
      const request = createRequest([true])
      const result = await avalancheSetDeveloperModeHandler.handle(
        request,
        mockListenerApi
      )
      expect(result).toEqual({
        success: true,
        value: 'Developer Mode set to true'
      })
    })
  })
})
