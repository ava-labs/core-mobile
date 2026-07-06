import { TokenType as FusionTokenType } from '@avalabs/fusion-sdk'
import type { Caip2ChainId } from '@avalabs/fusion-sdk'
import { getV2Tokens } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { fetchMarkrTargetChainAssets } from './fetchMarkrTargetChainAssets'

jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  getV2Tokens: jest.fn()
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

const mockedGetV2Tokens = getV2Tokens as unknown as jest.Mock

const apiToken = (overrides: Record<string, unknown> = {}) => ({
  symbol: 'USDC',
  name: 'USD Coin',
  address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  decimals: 6,
  isNative: false,
  internalId: 'usdc-eip155-43114',
  logoUri: 'https://example.com/usdc.png',
  networkCaip2Id: 'eip155:43114',
  top250Rank: null,
  contractType: 'ERC-20',
  ...overrides
})

const mockResponse = ({
  tokens,
  currentPage,
  totalPages
}: {
  tokens: ReturnType<typeof apiToken>[]
  currentPage: number
  totalPages: number
}) => ({
  data: {
    data: { tokens },
    metadata: { currentPage, totalPages }
  }
})

const cChain = 'eip155:43114' as Caip2ChainId

describe('fetchMarkrTargetChainAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls getV2Tokens with the target chain, page, and limit', async () => {
    mockedGetV2Tokens.mockResolvedValue(
      mockResponse({ tokens: [], currentPage: 1, totalPages: 1 })
    )

    await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 1,
      limit: 50
    })

    expect(mockedGetV2Tokens).toHaveBeenCalledWith({
      client: expect.any(Object),
      query: {
        caip2Id: cChain,
        page: 1,
        limit: 50
      }
    })
  })

  it('forwards a keyword search', async () => {
    mockedGetV2Tokens.mockResolvedValue(
      mockResponse({ tokens: [], currentPage: 1, totalPages: 1 })
    )

    await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 1,
      limit: 50,
      search: { type: 'keyword', value: 'usdc' }
    })

    expect(mockedGetV2Tokens.mock.calls[0]?.[0]?.query).toMatchObject({
      keyword: 'usdc'
    })
    expect(mockedGetV2Tokens.mock.calls[0]?.[0]?.query).not.toHaveProperty(
      'address'
    )
  })

  it('forwards an address search', async () => {
    mockedGetV2Tokens.mockResolvedValue(
      mockResponse({ tokens: [], currentPage: 1, totalPages: 1 })
    )

    await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 1,
      limit: 50,
      search: { type: 'address', value: '0xabc' }
    })

    expect(mockedGetV2Tokens.mock.calls[0]?.[0]?.query).toMatchObject({
      address: '0xabc'
    })
    expect(mockedGetV2Tokens.mock.calls[0]?.[0]?.query).not.toHaveProperty(
      'keyword'
    )
  })

  it('maps api tokens into SDK assets', async () => {
    mockedGetV2Tokens.mockResolvedValue(
      mockResponse({
        tokens: [apiToken()],
        currentPage: 1,
        totalPages: 1
      })
    )

    const result = await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 1,
      limit: 50
    })

    expect(result.assets).toHaveLength(1)
    expect(result.assets[0]).toMatchObject({
      type: FusionTokenType.ERC20,
      symbol: 'USDC',
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
    })
  })

  it('filters out tokens that cannot be mapped (e.g. non-native without address)', async () => {
    mockedGetV2Tokens.mockResolvedValue(
      mockResponse({
        tokens: [
          apiToken(),
          apiToken({ symbol: 'BAD', address: '', isNative: false })
        ],
        currentPage: 1,
        totalPages: 1
      })
    )

    const result = await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 1,
      limit: 50
    })

    expect(result.assets).toHaveLength(1)
    expect(result.assets[0]?.symbol).toBe('USDC')
  })

  it('reports hasMore=true and nextPage when more pages exist', async () => {
    mockedGetV2Tokens.mockResolvedValue(
      mockResponse({ tokens: [apiToken()], currentPage: 2, totalPages: 5 })
    )

    const result = await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 2,
      limit: 50
    })

    expect(result.meta).toEqual({
      currentPage: 2,
      hasMore: true,
      nextPage: 3
    })
  })

  it('reports hasMore=false on the last page', async () => {
    mockedGetV2Tokens.mockResolvedValue(
      mockResponse({ tokens: [], currentPage: 5, totalPages: 5 })
    )

    const result = await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 5,
      limit: 50
    })

    expect(result.meta).toEqual({
      currentPage: 5,
      hasMore: false,
      nextPage: undefined
    })
  })

  it('falls back to the requested page when metadata is missing', async () => {
    mockedGetV2Tokens.mockResolvedValue({
      data: { data: { tokens: [] } }
    })

    const result = await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 3,
      limit: 50
    })

    expect(result.meta).toEqual({
      currentPage: 3,
      hasMore: false,
      nextPage: undefined
    })
  })

  it('returns empty assets when the response has no tokens', async () => {
    mockedGetV2Tokens.mockResolvedValue({ data: {} })

    const result = await fetchMarkrTargetChainAssets({
      targetChainId: cChain,
      page: 1,
      limit: 50
    })

    expect(result.assets).toEqual([])
    expect(result.meta.hasMore).toBe(false)
  })
})
