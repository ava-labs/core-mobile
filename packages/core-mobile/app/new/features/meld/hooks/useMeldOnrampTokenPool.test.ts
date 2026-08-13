import { renderHook } from '@testing-library/react-hooks'
import { keepPreviousData } from '@tanstack/react-query'
import { TokenType } from '@avalabs/vm-module-types'
import type { SPLToken } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { TokenVisibility } from 'store/portfolio'
import type { ApiToken } from 'features/swap/types'
import type { CryptoCurrency } from 'features/meld/types'
import { getV2Tokens } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import type { GetV2TokensResponse } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { isTokenTradable } from '../utils'
import { useMeldOnrampTokenPool, __testables } from './useMeldOnrampTokenPool'

jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  getV2Tokens: jest.fn()
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
}))

// The hook-level test below (`keepPreviousData` wiring) only needs
// useInfiniteQuery's call args, not real fetch/cache behavior -- mocking it
// keeps that test independent of every other hook it composes with.
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useInfiniteQuery: jest.fn()
}))

jest.mock('react-redux', () => ({
  useSelector: (fn: () => unknown) => fn()
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => false
}))
jest.mock('store/account', () => ({
  selectActiveAccount: () => ({ id: 'acc-1', index: 0, walletId: 'w1' })
}))
jest.mock('store/portfolio', () => ({
  selectTokenVisibility: () => ({})
}))
jest.mock('store/network', () => ({
  // 43114 == ChainId.AVALANCHE_MAINNET_ID -- inlined because jest.mock
  // factories can't reference out-of-scope imports.
  selectEnabledChainIds: () => [43114, 1]
}))
jest.mock('store/posthog/slice', () => ({
  selectIsSolanaSupportBlocked: () => true
}))
jest.mock('hooks/earn/useCChainNetwork', () => ({
  __esModule: true,
  // 43114 == ChainId.AVALANCHE_MAINNET_ID -- see note above.
  default: () => ({ chainId: 43114 })
}))
jest.mock('hooks/networks/useNetworks', () => ({
  useNetworks: () => ({ allNetworks: {} })
}))
jest.mock('services/network/utils/providerUtils', () => ({
  getEthereumNetwork: () => ({ chainId: 1 })
}))
jest.mock('hooks/useDebounce', () => ({
  useDebounce: (value: string) => ({ debounced: value })
}))
jest.mock('features/portfolio/hooks/useTokensWithBalanceForAccount', () => ({
  useTokensWithBalanceForAccount: () => []
}))
jest.mock('common/hooks/useTokenLookup', () => ({
  ...jest.requireActual('common/hooks/useTokenLookup'),
  useTokenLookup: () => ({ data: {}, isLoading: false })
}))

const mockedGetV2Tokens = getV2Tokens as unknown as jest.Mock
const mockedUseInfiniteQuery = jest.requireMock('@tanstack/react-query')
  .useInfiniteQuery as jest.Mock

const {
  buildHeldIndex,
  collectNetworkChainIds,
  mapUnheldApiTokens,
  toZeroBalanceLocalToken,
  filterTokenPool,
  buildTokenPool,
  resolveSearchParam,
  getNextPage,
  fetchTokenPage,
  buildUsdcSolanaCandidate
} = __testables

const CCHAIN_CAIP2_ID = 'eip155:43114'
const EVM_ADDRESS_LIKE = '0x0000000000000000000000000000000000000001'

const heldToken = (
  overrides: Partial<LocalTokenWithBalance> = {}
): LocalTokenWithBalance =>
  ({
    localId: '0xheld',
    address: '0xheld',
    name: 'Held Token',
    symbol: 'HELD',
    type: TokenType.ERC20,
    decimals: 18,
    networkChainId: ChainId.AVALANCHE_MAINNET_ID,
    balance: 100n,
    balanceDisplayValue: '100',
    balanceInCurrency: 10,
    priceInCurrency: 1,
    reputation: null,
    ...overrides
  } as LocalTokenWithBalance)

const apiToken = (overrides: Partial<ApiToken> = {}): ApiToken =>
  ({
    internalId: 'token-1',
    address: '0xabc',
    name: 'Unheld Token',
    symbol: 'UNH',
    isNative: false,
    logoUri: null,
    decimals: 18,
    isVerified: true,
    top250Rank: null,
    networkCaip2Id: CCHAIN_CAIP2_ID,
    contractType: 'ERC-20',
    ...overrides
  } as ApiToken)

const cryptoCurrency = (
  overrides: Partial<CryptoCurrency> = {}
): CryptoCurrency => ({
  currencyCode: 'UNH',
  name: 'Unheld Token',
  chainId: ChainId.AVALANCHE_MAINNET_ID.toString(),
  contractAddress: '0xabc',
  ...overrides
})

const page = (
  tokens: ApiToken[],
  currentPage = 1,
  totalPages = 1
): GetV2TokensResponse =>
  ({
    data: {
      tokens,
      networks: {
        [CCHAIN_CAIP2_ID]: {
          caip2Id: CCHAIN_CAIP2_ID,
          chainId: ChainId.AVALANCHE_MAINNET_ID
        }
      }
    },
    metadata: { currentPage, totalPages, totalRecords: tokens.length }
  } as unknown as GetV2TokensResponse)

describe('useMeldOnrampTokenPool pure helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('buildHeldIndex', () => {
    it('indexes held tokens by lowercased localId', () => {
      const index = buildHeldIndex([heldToken({ localId: '0xABC' })])
      expect(index.has('0xabc')).toBe(true)
    })

    it('skips tokens without a localId', () => {
      const index = buildHeldIndex([heldToken({ localId: '' })])
      expect(index.size).toBe(0)
    })
  })

  describe('collectNetworkChainIds', () => {
    it('merges caip2Id -> chainId across pages', () => {
      const result = collectNetworkChainIds([page([]), null])
      expect(result.get(CCHAIN_CAIP2_ID)).toBe(ChainId.AVALANCHE_MAINNET_ID)
    })

    it('handles a page with no networks', () => {
      const result = collectNetworkChainIds([null])
      expect(result.size).toBe(0)
    })
  })

  describe('mapUnheldApiTokens', () => {
    it('excludes native tokens', () => {
      const result = mapUnheldApiTokens(
        [apiToken({ isNative: true, address: '' })],
        new Map([[CCHAIN_CAIP2_ID, ChainId.AVALANCHE_MAINNET_ID]]),
        new Map()
      )
      expect(result).toHaveLength(0)
    })

    it('excludes tokens whose network chainId is unresolved', () => {
      const result = mapUnheldApiTokens(
        [apiToken({ networkCaip2Id: 'eip155:999' })],
        new Map([[CCHAIN_CAIP2_ID, ChainId.AVALANCHE_MAINNET_ID]]),
        new Map()
      )
      expect(result).toHaveLength(0)
    })

    it('excludes tokens already held (dedupe by localId)', () => {
      const held = new Map([['0xabc', heldToken({ localId: '0xabc' })]])
      const result = mapUnheldApiTokens(
        [apiToken({ address: '0xABC' })],
        new Map([[CCHAIN_CAIP2_ID, ChainId.AVALANCHE_MAINNET_ID]]),
        held
      )
      expect(result).toHaveLength(0)
    })

    it('maps a genuinely unheld ERC-20 token with the joined chainId', () => {
      const result = mapUnheldApiTokens(
        [apiToken()],
        new Map([[CCHAIN_CAIP2_ID, ChainId.AVALANCHE_MAINNET_ID]]),
        new Map()
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        symbol: 'UNH',
        networkChainId: ChainId.AVALANCHE_MAINNET_ID,
        balance: 0n
      })
    })

    // CP-14936 review finding: `isSupportedToken` (../utils.ts) requires a
    // `chainId` key to match an unheld token against a Meld CryptoCurrency.
    // `mapApiTokenToLocal` (shared with swap) never sets it, which silently
    // made every unheld v2 token untradable -- assert both that the key
    // exists (`in`, not just `=== undefined`) and that the end-to-end
    // isTokenTradable check it feeds actually passes.
    it('sets chainId (not just networkChainId) so the token is matchable via isTokenTradable', () => {
      const result = mapUnheldApiTokens(
        [apiToken({ address: '0xabc' })],
        new Map([[CCHAIN_CAIP2_ID, ChainId.AVALANCHE_MAINNET_ID]]),
        new Map()
      )
      const mappedToken = result[0]
      expect(mappedToken).toBeDefined()
      if (!mappedToken) return
      expect('chainId' in mappedToken).toBe(true)
      if ('chainId' in mappedToken) {
        expect(mappedToken.chainId).toBe(ChainId.AVALANCHE_MAINNET_ID)
      }

      const crypto = cryptoCurrency({
        chainId: ChainId.AVALANCHE_MAINNET_ID.toString(),
        contractAddress: '0xabc'
      })
      expect(
        isTokenTradable(crypto, mappedToken as LocalTokenWithBalance)
      ).toBe(true)
    })
  })

  describe('toZeroBalanceLocalToken', () => {
    it('synthesizes a zero-balance token from an SPLToken candidate', () => {
      const candidate: SPLToken = {
        address: 'USDC_SOLANA_ADDRESS',
        name: 'USD Coin',
        symbol: 'USDC',
        contractType: TokenType.SPL,
        type: TokenType.SPL,
        decimals: 6,
        chainId: ChainId.SOLANA_MAINNET_ID
      } as SPLToken

      const result = toZeroBalanceLocalToken(candidate)

      expect(result.balance).toBe(0n)
      expect(result.localId).toBe('USDC_SOLANA_ADDRESS')
      expect(result.networkChainId).toBe(ChainId.SOLANA_MAINNET_ID)
    })
  })

  describe('filterTokenPool', () => {
    const visibleEverywhere: TokenVisibility = {}

    it('drops blacklisted tokens', () => {
      const token = heldToken({ localId: '0xbad' })
      const result = filterTokenPool([token], { '0xbad': false }, [
        ChainId.AVALANCHE_MAINNET_ID
      ])
      expect(result).toHaveLength(0)
    })

    it('drops NFTs', () => {
      const token = heldToken({ type: TokenType.ERC721 })
      const result = filterTokenPool([token], visibleEverywhere, [
        ChainId.AVALANCHE_MAINNET_ID
      ])
      expect(result).toHaveLength(0)
    })

    it('drops tokens on disabled chains', () => {
      const token = heldToken({ networkChainId: 999999 })
      const result = filterTokenPool([token], visibleEverywhere, [
        ChainId.AVALANCHE_MAINNET_ID
      ])
      expect(result).toHaveLength(0)
    })

    it('keeps a visible, non-NFT token on an enabled chain', () => {
      const token = heldToken()
      const result = filterTokenPool([token], visibleEverywhere, [
        ChainId.AVALANCHE_MAINNET_ID
      ])
      expect(result).toHaveLength(1)
    })
  })

  describe('buildTokenPool', () => {
    it('returns nothing when disabled', () => {
      const result = buildTokenPool({
        enabled: false,
        heldTokens: [heldToken()],
        pages: [page([apiToken()])],
        usdcSolanaCandidate: undefined,
        tokenVisibility: {},
        enabledChainIds: [ChainId.AVALANCHE_MAINNET_ID]
      })
      expect(result).toHaveLength(0)
    })

    it('unions held tokens with unheld v2 candidates, held first', () => {
      const held = heldToken({ localId: '0xheld', address: '0xheld' })
      const result = buildTokenPool({
        enabled: true,
        heldTokens: [held],
        pages: [page([apiToken({ address: '0xUnheld' })])],
        usdcSolanaCandidate: undefined,
        tokenVisibility: {},
        enabledChainIds: [ChainId.AVALANCHE_MAINNET_ID]
      })
      expect(result).toHaveLength(2)
      expect(result[0]).toBe(held)
    })

    it('drops the v2 candidate when the same token is already held', () => {
      const held = heldToken({ localId: '0xabc', address: '0xabc' })
      const result = buildTokenPool({
        enabled: true,
        heldTokens: [held],
        pages: [page([apiToken({ address: '0xABC' })])],
        usdcSolanaCandidate: undefined,
        tokenVisibility: {},
        enabledChainIds: [ChainId.AVALANCHE_MAINNET_ID]
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(held)
    })

    it('adds the USDC-Solana candidate when unheld', () => {
      const candidate: SPLToken = {
        address: 'USDC_SOLANA_ADDRESS',
        name: 'USD Coin',
        symbol: 'USDC',
        contractType: TokenType.SPL,
        type: TokenType.SPL,
        decimals: 6,
        chainId: ChainId.SOLANA_MAINNET_ID
      } as SPLToken

      const result = buildTokenPool({
        enabled: true,
        heldTokens: [],
        pages: [],
        usdcSolanaCandidate: candidate,
        tokenVisibility: {},
        enabledChainIds: [ChainId.SOLANA_MAINNET_ID]
      })
      expect(result).toHaveLength(1)
      expect(result[0]?.symbol).toBe('USDC')
    })
  })

  describe('resolveSearchParam', () => {
    it('returns undefined for empty text', () => {
      expect(resolveSearchParam('', false)).toBeUndefined()
    })

    it('returns undefined for a single character (below the keyword minimum)', () => {
      expect(resolveSearchParam('u', false)).toBeUndefined()
    })

    it('returns a keyword param for plain text >= 2 chars', () => {
      expect(resolveSearchParam('usdc', false)).toEqual({ keyword: 'usdc' })
    })

    it('routes an address-like paste to the address filter', () => {
      expect(resolveSearchParam(EVM_ADDRESS_LIKE, false)).toEqual({
        address: EVM_ADDRESS_LIKE
      })
    })
  })

  describe('getNextPage', () => {
    it('returns undefined when there is no metadata', () => {
      expect(getNextPage(null)).toBeUndefined()
    })

    it('returns undefined on the last page', () => {
      expect(getNextPage(page([], 3, 3))).toBeUndefined()
    })

    it('returns the next page number when more pages remain', () => {
      expect(getNextPage(page([], 2, 5))).toBe(3)
    })
  })

  describe('buildUsdcSolanaCandidate', () => {
    it('returns undefined when there is no lookup hit', () => {
      expect(buildUsdcSolanaCandidate(undefined)).toBeUndefined()
    })

    it('falls back to 6 decimals when meta omits it', () => {
      const result = buildUsdcSolanaCandidate({
        internalId: 'usdc-solana',
        isNative: false,
        name: 'USD Coin',
        symbol: 'USDC',
        platforms: {}
      } as never)
      expect(result?.decimals).toBe(6)
    })
  })
})

describe('fetchTokenPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('forwards caip2Ids, page, limit and the search param', async () => {
    const responseData = page([])
    mockedGetV2Tokens.mockResolvedValue({ data: responseData })

    const result = await fetchTokenPage(
      [CCHAIN_CAIP2_ID],
      { keyword: 'usdc' },
      1
    )

    expect(mockedGetV2Tokens).toHaveBeenCalledWith({
      client: {},
      query: {
        caip2Id: [CCHAIN_CAIP2_ID],
        page: 1,
        limit: 200,
        keyword: 'usdc'
      }
    })
    expect(result).toBe(responseData)
  })

  it('returns null when the response has no data', async () => {
    mockedGetV2Tokens.mockResolvedValue({})
    const result = await fetchTokenPage([CCHAIN_CAIP2_ID], undefined, 1)
    expect(result).toBeNull()
  })
})

describe('useMeldOnrampTokenPool', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn()
    })
  })

  // CP-14936 review finding: typing a search keyword produced a new query
  // key with no data yet, and TokenList's loading guard read that as "no
  // results" and replaced the whole screen (search input, keyboard and all)
  // with a full-screen spinner on every keystroke. `placeholderData:
  // keepPreviousData` keeps the prior page's results (and `isLoading` false)
  // while the new keyword's request is in flight.
  it('passes placeholderData: keepPreviousData to useInfiniteQuery', () => {
    renderHook(() => useMeldOnrampTokenPool({ searchText: 'usdc' }))

    expect(mockedUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ placeholderData: keepPreviousData })
    )
  })
})
