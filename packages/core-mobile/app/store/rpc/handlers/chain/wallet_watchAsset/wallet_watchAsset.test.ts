import { rpcErrors } from '@metamask/rpc-errors'
import { ERC20Token, TokenType } from '@avalabs/vm-module-types'
import { RpcMethod, RpcProvider, RpcRequest } from 'store/rpc/types'
import mockSession from 'tests/fixtures/walletConnect/session.json'
import { addCustomToken } from 'store/customToken/slice'
import { router } from 'expo-router'
import { walletConnectCache } from 'services/walletconnectv2/walletConnectCache/walletConnectCache'
import { walletWatchAssetHandler as handler } from './wallet_watchAsset'

jest.mock('expo-router')
jest.mock(
  'services/walletconnectv2/walletConnectCache/walletConnectCache',
  () => ({
    walletConnectCache: {
      watchAssetParams: { set: jest.fn(), get: jest.fn(), clear: jest.fn() }
    }
  })
)

const mockDispatch = jest.fn()
const mockListenerApi = {
  getState: jest.fn(),
  dispatch: mockDispatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

const createRequest = (
  params: unknown,
  chainId = 'eip155:1'
): RpcRequest<RpcMethod.WALLET_WATCH_ASSET> => ({
  provider: RpcProvider.WALLET_CONNECT,
  method: RpcMethod.WALLET_WATCH_ASSET,
  data: {
    id: 1,
    topic: 'test-topic',
    params: {
      request: { method: RpcMethod.WALLET_WATCH_ASSET, params },
      chainId
    }
  },
  peerMeta: mockSession.peer.metadata
})

const validOptions = {
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  symbol: 'DAI',
  decimals: 18,
  image: 'https://dai.stablecoin.science/img/dai.svg'
}

describe('wallet_watchAsset handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('contains correct methods', () => {
    expect(handler.methods).toEqual(['wallet_watchAsset'])
  })

  describe('handle', () => {
    it('stores params in walletConnectCache, navigates to /watchAsset, and returns DEFERRED_RESULT', async () => {
      const request = createRequest([{ type: 'ERC20', options: validOptions }])

      const result = await handler.handle(request, mockListenerApi)

      expect(walletConnectCache.watchAssetParams.set).toHaveBeenCalledWith({
        request,
        token: expect.objectContaining({
          type: TokenType.ERC20,
          address: validOptions.address,
          symbol: validOptions.symbol,
          decimals: validOptions.decimals,
          logoUri: validOptions.image
        })
      })
      expect(router.navigate).toHaveBeenCalledWith('/watchAsset')
      expect(result).toEqual({ success: true, value: expect.any(Symbol) })
    })

    it('accepts object-form params (non-array) from non-standard dApps', async () => {
      const request = createRequest({ type: 'ERC20', options: validOptions })

      const result = await handler.handle(request, mockListenerApi)

      expect(walletConnectCache.watchAssetParams.set).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ success: true, value: expect.any(Symbol) })
    })

    it('coerces string decimals to a number', async () => {
      const request = createRequest([
        { type: 'ERC20', options: { ...validOptions, decimals: '6' } }
      ])

      await handler.handle(request, mockListenerApi)

      const cached = (walletConnectCache.watchAssetParams.set as jest.Mock).mock
        .calls[0][0]
      expect(cached.token.decimals).toBe(6)
    })

    it('defaults logoUri to empty string when image is absent', async () => {
      const { image, ...optionsWithoutImage } = validOptions
      const request = createRequest([
        { type: 'ERC20', options: optionsWithoutImage }
      ])

      await handler.handle(request, mockListenerApi)

      const cached = (walletConnectCache.watchAssetParams.set as jest.Mock).mock
        .calls[0][0]
      expect(cached.token.logoUri).toBe('')
    })

    it('returns invalidParams error for non-ERC20 type', async () => {
      const request = createRequest([{ type: 'ERC721', options: validOptions }])

      const result = await handler.handle(request, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Invalid wallet_watchAsset params')
      })
      expect(walletConnectCache.watchAssetParams.set).not.toHaveBeenCalled()
    })

    it('returns invalidParams error when address is missing', async () => {
      const { address, ...optionsWithoutAddress } = validOptions
      const request = createRequest([
        { type: 'ERC20', options: optionsWithoutAddress }
      ])

      const result = await handler.handle(request, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Invalid wallet_watchAsset params')
      })
    })

    it('returns invalidParams error when symbol is missing', async () => {
      const { symbol, ...optionsWithoutSymbol } = validOptions
      const request = createRequest([
        { type: 'ERC20', options: optionsWithoutSymbol }
      ])

      const result = await handler.handle(request, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Invalid wallet_watchAsset params')
      })
    })

    it('returns invalidParams error when decimals is a non-numeric string', async () => {
      const request = createRequest([
        { type: 'ERC20', options: { ...validOptions, decimals: 'bad' } }
      ])

      const result = await handler.handle(request, mockListenerApi)

      expect(result).toEqual({
        success: false,
        error: rpcErrors.invalidParams('Invalid wallet_watchAsset params')
      })
    })

    it('returns invalidParams error for null/empty params', async () => {
      for (const params of [null, [], [null]]) {
        const request = createRequest(params)
        const result = await handler.handle(request, mockListenerApi)
        expect(result.success).toBe(false)
      }
    })
  })

  describe('approve', () => {
    const token: ERC20Token = {
      type: TokenType.ERC20,
      address: validOptions.address,
      name: validOptions.symbol,
      symbol: validOptions.symbol,
      decimals: validOptions.decimals,
      logoUri: validOptions.image
    }

    it('dispatches addCustomToken with the correct chainId and returns true', async () => {
      const request = createRequest(
        [{ type: 'ERC20', options: validOptions }],
        'eip155:1'
      )

      const result = await handler.approve(
        { request, data: { token } },
        mockListenerApi
      )

      expect(mockDispatch).toHaveBeenCalledWith(
        addCustomToken({ chainId: 1, token })
      )
      expect(result).toEqual({ success: true, value: true })
    })

    it('extracts chainId correctly from CAIP-2 format', async () => {
      const request = createRequest(
        [{ type: 'ERC20', options: validOptions }],
        'eip155:43114'
      )

      await handler.approve({ request, data: { token } }, mockListenerApi)

      expect(mockDispatch).toHaveBeenCalledWith(
        addCustomToken({ chainId: 43114, token })
      )
    })

    it('returns internal error when approve data has no token', async () => {
      const request = createRequest([{ type: 'ERC20', options: validOptions }])

      for (const data of [null, {}, { token: null }]) {
        const result = await handler.approve({ request, data }, mockListenerApi)
        expect(result).toEqual({
          success: false,
          error: rpcErrors.internal('Invalid approve data')
        })
      }
      expect(mockDispatch).not.toHaveBeenCalled()
    })
  })
})
