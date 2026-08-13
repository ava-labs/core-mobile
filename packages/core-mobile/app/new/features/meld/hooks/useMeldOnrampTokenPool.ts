import { useMemo } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import type { SPLToken } from '@avalabs/vm-module-types'
import { useDebounce } from 'hooks/useDebounce'
import { useNetworks } from 'hooks/networks/useNetworks'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { getEthereumNetwork } from 'services/network/utils/providerUtils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectActiveAccount } from 'store/account'
import { selectTokenVisibility, TokenVisibility } from 'store/portfolio'
import { selectEnabledChainIds } from 'store/network'
import { selectIsSolanaSupportBlocked } from 'store/posthog/slice'
import { isTokenVisible } from 'store/balance/utils'
import { LocalTokenWithBalance } from 'store/balance'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { tokenAddresses } from 'consts/tokenIds'
import { getEvmCaip2ChainId, getSolanaCaip2ChainId } from 'utils/caip2ChainIds'
import { isDefined } from 'common/utils/isDefined'
import { isAddressLikeSearch } from 'common/utils/isAddressLikeSearch'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { mapApiTokenToLocal } from 'features/swap/utils/mapApiTokenToLocal'
import type { ApiToken } from 'features/swap/types'
import {
  getV2Tokens,
  type GetV2TokensResponse,
  type NetworkTokensByCaip2Response
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'
import { tokenLookupKey, useTokenLookup } from 'common/hooks/useTokenLookup'

const SOLANA_CAIP2_ID = getSolanaCaip2ChainId(ChainId.SOLANA_MAINNET_ID)
const USDC_SOLANA_LOOKUP_IDS = [
  { caip2Id: SOLANA_CAIP2_ID, address: tokenAddresses.USDC_SOLANA }
]
const usdcSolanaLookupKey = tokenLookupKey(
  SOLANA_CAIP2_ID,
  tokenAddresses.USDC_SOLANA
)

// Generous enough that the common case (Meld's supported-currency list
// matched against the highest-ranked C-Chain/Ethereum tokens) is covered by
// a single page -- see CP-14936 step-3 plan.
const PAGE_LIMIT = 200
const SEARCH_DEBOUNCE_MS = 300

const isNotBlacklisted =
  (tokenVisibility: TokenVisibility) => (token: LocalTokenWithBalance) =>
    isTokenVisible(tokenVisibility, token)

const isNotNFT = (token: LocalTokenWithBalance): boolean =>
  token.type !== TokenType.ERC1155 && token.type !== TokenType.ERC721

const isNotDisabled =
  (enabledChainIds: number[]) => (token: LocalTokenWithBalance) =>
    enabledChainIds.includes(token.networkChainId)

const buildHeldIndex = (
  heldTokens: LocalTokenWithBalance[]
): Map<string, LocalTokenWithBalance> => {
  const index = new Map<string, LocalTokenWithBalance>()
  heldTokens.forEach(token => {
    if (token.localId) {
      index.set(token.localId.toLowerCase(), token)
    }
  })
  return index
}

const collectNetworkChainIds = (
  pages: Array<GetV2TokensResponse | null>
): Map<string, number> => {
  const networksByCaip2Id = new Map<string, number>()
  pages.forEach(page => {
    const networks = page?.data?.networks
    if (!networks) return
    Object.values(networks).forEach(network => {
      networksByCaip2Id.set(network.caip2Id, network.chainId)
    })
  })
  return networksByCaip2Id
}

// `isSupportedToken` (see ../utils.ts) requires `'chainId' in token` to match
// an unheld token, which the swap-shared `mapApiTokenToLocal` never sets --
// added here instead of there so swap's output shape is untouched.
const mapUnheldApiTokenToMeldLocal = (
  apiToken: ApiToken,
  chainId: number
): LocalTokenWithBalance =>
  ({
    ...mapApiTokenToLocal(apiToken, chainId),
    chainId
  } as LocalTokenWithBalance)

// Unheld candidates only -- natives are excluded (see hook doc comment) and
// anything already held is skipped so the held copy (real balance) wins.
const mapUnheldApiTokens = (
  apiTokens: ApiToken[],
  networksByCaip2Id: Map<string, number>,
  heldByLocalId: Map<string, LocalTokenWithBalance>
): LocalTokenWithBalance[] => {
  const unheldCandidates: LocalTokenWithBalance[] = []
  apiTokens.forEach(apiToken => {
    if (apiToken.isNative) return

    const chainId = networksByCaip2Id.get(apiToken.networkCaip2Id)
    if (chainId === undefined) return

    const mapped = mapUnheldApiTokenToMeldLocal(apiToken, chainId)
    if (heldByLocalId.has(mapped.localId.toLowerCase())) return
    unheldCandidates.push(mapped)
  })
  return unheldCandidates
}

const toZeroBalanceLocalToken = (candidate: SPLToken): LocalTokenWithBalance =>
  ({
    ...candidate,
    localId: candidate.address,
    networkChainId: candidate.chainId,
    isDataAccurate: true,
    balance: 0n,
    balanceDisplayValue: '0',
    balanceInCurrency: 0,
    priceInCurrency: 0,
    marketCap: 0,
    change24: 0,
    vol24: 0,
    reputation: null
  } as LocalTokenWithBalance)

const filterTokenPool = (
  tokens: LocalTokenWithBalance[],
  tokenVisibility: TokenVisibility,
  enabledChainIds: number[]
): LocalTokenWithBalance[] =>
  tokens
    .filter(isNotBlacklisted(tokenVisibility))
    .filter(isNotNFT)
    .filter(isNotDisabled(enabledChainIds))

const buildTokenPool = ({
  enabled,
  heldTokens,
  pages,
  usdcSolanaCandidate,
  tokenVisibility,
  enabledChainIds
}: {
  enabled: boolean
  heldTokens: LocalTokenWithBalance[]
  pages: Array<GetV2TokensResponse | null> | undefined
  usdcSolanaCandidate: SPLToken | undefined
  tokenVisibility: TokenVisibility
  enabledChainIds: number[]
}): LocalTokenWithBalance[] => {
  if (!enabled) return []

  const heldByLocalId = buildHeldIndex(heldTokens)
  const apiTokens: ApiToken[] = (pages ?? []).flatMap(
    page => page?.data?.tokens ?? []
  )
  const networksByCaip2Id = collectNetworkChainIds(pages ?? [])
  const unheldCandidates = mapUnheldApiTokens(
    apiTokens,
    networksByCaip2Id,
    heldByLocalId
  )

  if (
    usdcSolanaCandidate &&
    !heldByLocalId.has(usdcSolanaCandidate.address.toLowerCase())
  ) {
    unheldCandidates.push(toZeroBalanceLocalToken(usdcSolanaCandidate))
  }

  return filterTokenPool(
    [...heldTokens, ...unheldCandidates],
    tokenVisibility,
    enabledChainIds
  )
}

type SearchParam = { address: string } | { keyword: string } | undefined

// v2's `keyword` filter requires >= 2 chars server-side; an address-like
// paste is routed to the exact-match `address` filter instead so users can
// still search by contract address (client substring search in TokenList
// can't do this once the fetch itself is keyword-scoped).
//
// `isAddressLikeSearch` also matches non-EVM shapes (Solana/BTC/X-P). Those
// still take this branch and correctly yield zero results: `caip2Ids` above
// is always C-Chain + Ethereum only, so there's no chain for them to match.
const resolveSearchParam = (
  trimmedSearchText: string,
  isDeveloperMode: boolean
): SearchParam => {
  if (trimmedSearchText.length === 0) return undefined
  if (isAddressLikeSearch(trimmedSearchText, isDeveloperMode)) {
    return { address: trimmedSearchText }
  }
  return trimmedSearchText.length >= 2
    ? { keyword: trimmedSearchText }
    : undefined
}

const getNextPage = (
  lastPage: GetV2TokensResponse | null
): number | undefined => {
  const meta = lastPage?.metadata
  if (!meta || meta.currentPage >= meta.totalPages) return undefined
  return meta.currentPage + 1
}

const fetchTokenPage = async (
  caip2Ids: string[],
  searchParam: SearchParam,
  pageParam: number
): Promise<GetV2TokensResponse | null> => {
  const response = await getV2Tokens({
    client: tokenAggregatorApi,
    query: {
      caip2Id: caip2Ids,
      page: pageParam,
      limit: PAGE_LIMIT,
      ...searchParam
    }
  })
  return response.data ?? null
}

const buildUsdcSolanaCandidate = (
  info: ReturnType<typeof useTokenLookup>['data'][string] | undefined
): SPLToken | undefined => {
  if (!info) return undefined
  return {
    address: tokenAddresses.USDC_SOLANA,
    name: info.name,
    symbol: info.symbol,
    contractType: TokenType.SPL,
    type: TokenType.SPL,
    caip2Id: SOLANA_CAIP2_ID,
    // 6 is USDC's canonical decimals, used only if the lookup entry omits meta.decimals
    decimals: info.meta?.decimals?.[SOLANA_CAIP2_ID] ?? 6,
    chainId: ChainId.SOLANA_MAINNET_ID,
    logoUri: info.meta?.logoUri ?? undefined
  }
}

/**
 * Candidate pool for the Meld onramp ("Select other token") picker.
 *
 * Uses a paginated, search-aware `/v2/tokens` fetch (instead of pulling the
 * full C-Chain + Ethereum ERC-20 contract-token catalog) unioned with every
 * token the active account currently holds (any chain, unscoped -- matches
 * prior behavior).
 *
 * Held tokens always win on dedupe: a token the user holds keeps its real
 * balance even if it also happens to come back in the v2 page.
 *
 * Native gas tokens (AVAX-C, ETH) are intentionally excluded from the
 * *unheld* v2 page -- the old ERC-20-only catalog never surfaced unheld
 * natives either (they only ever appeared via the held-token branch, or
 * via the dedicated "Select AVAX"/"Select USDC" buttons in SelectToken).
 */
export function useMeldOnrampTokenPool({
  searchText,
  enabled = true
}: {
  searchText: string
  enabled?: boolean
}): {
  tokens: LocalTokenWithBalance[]
  isLoading: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => void
} {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const isSolanaSupportBlocked = useSelector(selectIsSolanaSupportBlocked)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const enabledChainIds = useSelector(selectEnabledChainIds)
  const activeAccount = useSelector(selectActiveAccount)
  const cChainNetwork = useCChainNetwork()
  const { allNetworks } = useNetworks()
  const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)

  const caip2Ids = useMemo(
    () =>
      [cChainNetwork, ethereumNetwork]
        .filter(isDefined)
        .map(network => getEvmCaip2ChainId(network.chainId)),
    [cChainNetwork, ethereumNetwork]
  )

  const { debounced: debouncedSearchText } = useDebounce(
    searchText,
    SEARCH_DEBOUNCE_MS
  )

  const searchParam = useMemo(
    () => resolveSearchParam(debouncedSearchText.trim(), isDeveloperMode),
    [debouncedSearchText, isDeveloperMode]
  )

  const query = useInfiniteQuery({
    queryKey: [
      ReactQueryKeys.MELD_ONRAMP_TOKENS_V2,
      caip2Ids,
      searchParam
    ] as const,
    queryFn: ({ pageParam }) =>
      fetchTokenPage(caip2Ids, searchParam, pageParam),
    initialPageParam: 1,
    getNextPageParam: getNextPage,
    enabled: enabled && caip2Ids.length > 0,
    staleTime: 60 * 1000,
    // Keeps the previous search result's pages on screen while a new
    // (debounced) keyword/address query key is in flight, instead of
    // resetting to `isPending`/no-data -- that no-data state is what drove
    // TokenList's full-screen LoadingState to replace the search input (and
    // drop the keyboard) on every keystroke.
    placeholderData: keepPreviousData
  })

  const heldTokens = useTokensWithBalanceForAccount({
    account: enabled ? activeAccount : undefined
  })

  const usdcSolanaLookupIds = useMemo(
    () => (enabled && !isSolanaSupportBlocked ? USDC_SOLANA_LOOKUP_IDS : []),
    [enabled, isSolanaSupportBlocked]
  )
  const { data: usdcSolanaLookupTokens } = useTokenLookup(usdcSolanaLookupIds)

  const usdcSolanaCandidate = useMemo(
    () => buildUsdcSolanaCandidate(usdcSolanaLookupTokens[usdcSolanaLookupKey]),
    [usdcSolanaLookupTokens]
  )

  const pages = query.data?.pages
  const tokens = useMemo(
    () =>
      buildTokenPool({
        enabled,
        heldTokens,
        pages,
        usdcSolanaCandidate,
        tokenVisibility,
        enabledChainIds
      }),
    [
      enabled,
      heldTokens,
      pages,
      usdcSolanaCandidate,
      tokenVisibility,
      enabledChainIds
    ]
  )

  return {
    tokens,
    isLoading: enabled && query.isLoading,
    isFetching: enabled && query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: () => {
      if (query.hasNextPage) {
        query.fetchNextPage().catch(() => {
          // Errors surface via query.error on the next render; nothing to do here.
        })
      }
    }
  }
}

// Re-exported for the (colocated) unit tests to exercise the pure mapping
// logic directly, without spinning up react-query/hooks.
export const __testables = {
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
}

export type { NetworkTokensByCaip2Response }
