import { RpcMethod } from 'store/walletConnectV2/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import { ethErrors } from 'eth-rpc-errors'
import WalletService from 'services/wallet/WalletService'
import { avalancheGetAddressesInRangeHandler } from './avalanche_getAddressesInRange'
import { avalancheGetAddressesInRangeRpcRequest } from './types'

jest.mock('../index')
jest
  .spyOn(WalletService, 'getAddressesByIndices')
  .mockImplementation(
    ({ indices }: { indices: number[] }): Promise<string[]> =>
      Promise.resolve(indices.map(index => `X-avax${index}`))
  )

const createRequest = (
  params: unknown
): avalancheGetAddressesInRangeRpcRequest => {
  return {
    method: RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE,
    data: {
      id: 1,
      topic: '1',
      params: {
        request: {
          method: RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE,
          params
        },
        chainId: 'eip155:43114'
      }
    },
    session: mockSession
  }
}

describe('avalanche_getAddressesInRange.ts', () => {
  describe('handle', () => {
    it('returns error if request params do not meet zod validation rules', async () => {
      const requests = [
        createRequest([1, 2, 3, 4, 5]),
        createRequest([1, 2, 3]),
        createRequest(['1', 2, 3, 4]),
        createRequest([])
      ]
      const mockListenerApi = {
        getState: () => ({
          settings: { advanced: { developerMode: false } }
        }),
        dispatch: jest.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any

      for (const request of requests) {
        const result = await avalancheGetAddressesInRangeHandler.handle(
          request,
          mockListenerApi
        )
        expect(result).toEqual({
          success: false,
          error: ethErrors.rpc.invalidParams({
            message: 'avalanche_getAddressesInRange param is invalid'
          })
        })
      }
    })

    it('returns x/p addresses', async () => {
      const request = createRequest([0, 1, 1, 3])
      const mockListenerApi = {
        getState: () => ({
          settings: { advanced: { developerMode: false } }
        }),
        dispatch: jest.fn()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any

      const result = await avalancheGetAddressesInRangeHandler.handle(
        request,
        mockListenerApi
      )
      expect(result).toEqual({
        success: true,
        value: { external: ['avax0'], internal: ['avax1', 'avax2', 'avax3'] }
      })
    })
  })

  it('returns maximum of 100 x/p addresses', async () => {
    const request = createRequest([0, 1, 101, 203])
    const mockListenerApi = {
      getState: () => ({
        settings: { advanced: { developerMode: false } }
      }),
      dispatch: jest.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    const result = await avalancheGetAddressesInRangeHandler.handle(
      request,
      mockListenerApi
    )
    expect(result.success).toBe(true)
    // @ts-ignore
    expect(result.value.external.length).toBe(100)
    // @ts-ignore
    expect(result.value.internal.length).toBe(100)
  })
})
