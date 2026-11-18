import { router } from 'expo-router'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { DEFERRED_RESULT } from '../../types'
import { walletSwitchEthereumChainHandler as handler } from './wallet_switchEthereumChain'

const ETHEREUM = { chainId: 1, chainName: 'Ethereum', isTestnet: false }

jest.mock('store/network/slice', () => ({
  selectAllNetworks: () => ({ 1: ETHEREUM })
}))
jest.mock('expo-router')

const mockListenerApi = {
  getState: jest.fn(),
  dispatch: jest.fn()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const createRequest = (
  params: unknown,
  provider = RpcProvider.CORE_MOBILE
): RpcRequest<RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN> => ({
  provider,
  method: RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN,
  data: {
    id: 1,
    topic: 'topic',
    params: {
      request: { method: RpcMethod.WALLET_SWITCH_ETHEREUM_CHAIN, params },
      chainId: 'eip155:43114'
    }
  },
  peerMeta: {
    name: 'example.com',
    description: '',
    url: 'https://example.com',
    icons: []
  }
})

describe('wallet_switchEthereumChain handler', () => {
  beforeEach(() => {
    jest.spyOn(walletConnectCache.switchEthereumChainParams, 'set')
  })

  it('handles wallet_switchEthereumChain', () => {
    expect(handler.methods).toEqual(['wallet_switchEthereumChain'])
  })

  it('keeps returning success without a prompt for WalletConnect requests', async () => {
    const result = await handler.handle(
      createRequest([{ chainId: '0x1' }], RpcProvider.WALLET_CONNECT),
      mockListenerApi
    )

    expect(result).toEqual({ success: true, value: null })
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('opens the switch confirmation for in-app browser requests', async () => {
    const request = createRequest([{ chainId: '0x1' }])

    const result = await handler.handle(request, mockListenerApi)

    expect(result).toEqual({ success: true, value: DEFERRED_RESULT })
    expect(
      walletConnectCache.switchEthereumChainParams.set
    ).toHaveBeenCalledWith({ request, network: ETHEREUM })
    expect(router.navigate).toHaveBeenCalledWith('/switchEthereumChain')
  })

  it.each([[[]], [[{}]], [[{ chainId: 'zz' }]], ['not-an-array']])(
    'rejects invalid params %p',
    async params => {
      const result = await handler.handle(
        createRequest(params),
        mockListenerApi
      )

      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({ code: -32602 })
      })
      expect(router.navigate).not.toHaveBeenCalled()
    }
  )

  it('rejects a chain Core does not know', async () => {
    const result = await handler.handle(
      createRequest([{ chainId: '0x2a' }]),
      mockListenerApi
    )

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({ code: -32602 })
    })
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it('approve resolves null (the injected provider applies the switch)', async () => {
    await expect(handler.approve()).resolves.toEqual({
      success: true,
      value: null
    })
  })
})
