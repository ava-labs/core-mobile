/* eslint-disable @typescript-eslint/no-explicit-any */
import { TokenType } from '@avalabs/fusion-sdk'
import * as sdk from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { fetchTargetChainAssets } from './fetchTargetChainAssets'

jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  getV2Tokens: jest.fn()
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

const mockGetV2Tokens = sdk.getV2Tokens as jest.MockedFunction<
  typeof sdk.getV2Tokens
>

describe('fetchTargetChainAssets', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns ERC20 assets from v2 API', async () => {
    mockGetV2Tokens.mockResolvedValueOnce({
      data: {
        tokens: [
          {
            internalId: 'usdc-fuji',
            address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
            name: 'USD Coin',
            symbol: 'USDC',
            isNative: false,
            logoUri: 'https://example.com/usdc.png',
            decimals: 6
          }
        ]
      }
    } as any)

    const result = await fetchTargetChainAssets('eip155:43113')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      type: TokenType.ERC20,
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
    })
  })

  it('returns native tokens from v2 API as NativeAsset', async () => {
    mockGetV2Tokens.mockResolvedValueOnce({
      data: {
        tokens: [
          {
            internalId: 'avax-native',
            address: '',
            name: 'Avalanche',
            symbol: 'AVAX',
            isNative: true,
            logoUri: 'https://example.com/avax.png',
            decimals: 18
          }
        ]
      }
    } as any)

    const result = await fetchTargetChainAssets('eip155:43113')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: TokenType.NATIVE, symbol: 'AVAX' })
  })

  it('handles null logoUri', async () => {
    mockGetV2Tokens.mockResolvedValueOnce({
      data: {
        tokens: [
          {
            internalId: 'usdc-fuji',
            address: '0xabc',
            name: 'USD Coin',
            symbol: 'USDC',
            isNative: false,
            logoUri: null,
            decimals: 6
          }
        ]
      }
    } as any)

    const result = await fetchTargetChainAssets('eip155:43113')

    expect(result[0]).toMatchObject({ logoUri: undefined })
  })

  it('returns empty array when API call fails', async () => {
    mockGetV2Tokens.mockRejectedValueOnce(new Error('network error'))

    const result = await fetchTargetChainAssets('eip155:43113')

    expect(result).toEqual([])
  })

  it('returns empty array when API returns no data', async () => {
    mockGetV2Tokens.mockResolvedValueOnce({ data: null } as any)

    const result = await fetchTargetChainAssets('eip155:43113')

    expect(result).toEqual([])
  })

  it('passes caip2Id, limit: 1000, and page: 1 to the API', async () => {
    mockGetV2Tokens.mockResolvedValueOnce({ data: { tokens: [] } } as any)

    await fetchTargetChainAssets('eip155:43113')

    expect(mockGetV2Tokens).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { caip2Id: 'eip155:43113', limit: 1000, page: 1 }
      })
    )
  })
})
