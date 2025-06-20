import { RpcMethod, RpcProvider } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import { rpcErrors } from '@metamask/rpc-errors'
import WalletService from 'services/wallet/WalletService'
import mockNetworks from 'tests/fixtures/networks.json'
import mockWallets from 'tests/fixtures/wallets.json'
import mockAccounts from 'tests/fixtures/accounts.json'
import { avalancheGetAddressesInRangeHandler } from './avalanche_getAddressesInRange'
import { AvalancheGetAddressesInRangeRpcRequest } from './types'

jest.mock('../index')
jest
  .spyOn(WalletService, 'getAddressesByIndices')
  .mockImplementation(
    ({ indices }: { indices: number[] }): Promise<string[]> =>
      Promise.resolve(indices.map(index => `X-avax${index}`))
  )

jest.mock('store/settings/advanced/slice', () => {
  const actual = jest.requireActual('store/settings/advanced/slice')
  return {
    ...actual,
    selectIsDeveloperMode: () => true
  }
})

const mockActiveWallet = mockWallets['wallet-1']
jest.mock('store/wallet/slice', () => {
  const actual = jest.requireActual('store/wallet/slice')
  return {
    ...actual,
    selectActiveWallet: () => mockActiveWallet
  }
})

jest.mock('store/account/slice', () => {
  const actual = jest.requireActual('store/account/slice')
  return {
    ...actual,
    selectAccounts: () => mockAccounts,
    selectActiveAccount: () => mockAccounts[0]
  }
})

const createRequest = (
  params: unknown
): AvalancheGetAddressesInRangeRpcRequest => {
  return {
    provider: RpcProvider.WALLET_CONNECT,
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
    peerMeta: mockSession.peer.metadata
  }
}

describe('avalanche_getAddressesInRange.ts', () => {
  const mockListenerApi = {
    getState: () => ({
      network: { active: 43114, customNetworks: mockNetworks },
      settings: { advanced: { developerMode: false } }
    }),
    dispatch: jest.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any

  describe('handle', () => {
    it('returns error if request params do not meet zod validation rules', async () => {
      const requests = [
        createRequest([1, 2, 3, 4, 5]),
        createRequest([1, 2, 3]),
        createRequest(['1', 2, 3, 4]),
        createRequest([])
      ]

      for (const request of requests) {
        const result = await avalancheGetAddressesInRangeHandler.handle(
          request,
          mockListenerApi
        )
        expect(result).toEqual({
          success: false,
          error: rpcErrors.invalidParams(
            'avalanche_getAddressesInRange param is invalid'
          )
        })
      }
    })

    it('returns x/p addresses', async () => {
      const request = createRequest([0, 1, 1, 3])

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
