import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  TokenType as FusionTokenType,
  dedupeBridgeableAssets
} from '@avalabs/fusion-sdk'
import type {
  Asset,
  AssetSearchQuery,
  BridgeableUiAsset,
  Caip2ChainId,
  GetBridgeableAssetsResult
} from '@avalabs/fusion-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  selectActiveAccount,
  selectActiveAccountHasSolanaAddress
} from 'store/account'
import type { LocalTokenWithBalance } from 'store/balance'
import { selectIsSolanaSwapBlocked } from 'store/posthog'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  getCaip2ChainId,
  getChainIdFromCaip2,
  isSvmChainId
} from 'utils/caip2ChainIds'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { isAddressLikeSearch } from 'common/utils/isAddressLikeSearch'
import FusionService from '../services/FusionService'
import { mapSdkAssetToLocal } from '../utils/mapSdkAssetToLocal'
import { toSwappableAsset } from '../utils/fusionTypeConverters'
import {
  useIsFusionServiceReady,
  useSwapSelectedFromToken
} from './useZustandStore'

const STALE_TIME = 2 * 60 * 1000 // 2 minutes
const PAGE_LIMIT = 100 // max assets per page (SDK default)
const EMPTY_SEARCH: AssetSearchQuery | undefined = undefined

type UseSwapTokensResult = {
  tokens: LocalTokenWithBalance[]
  isLoading: boolean
  error: unknown | null
  fetchNextPage: () => Promise<unknown>
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

const toFusionSourceAsset = (
  token: LocalTokenWithBalance
): Asset | undefined => {
  try {
    return toSwappableAsset(token)
  } catch {
    return undefined
  }
}

const getLocalIdFromAsset = (asset: BridgeableUiAsset): string =>
  asset.type === FusionTokenType.NATIVE
    ? `NATIVE-${asset.symbol}`
    : asset.address.toLowerCase()

/**
 * Fetches the swap "to" token list for the given target chain using the
 * Fusion SDK's paginated `getBridgeableAssets`. Same hook serves both mainnet
 * and testnet — the SDK is the canonical source for swappable tokens regardless
 * of network.
 *
 * - Paginates via `useInfiniteQuery` (`fetchNextPage` triggers the next page).
 * - Search is delegated to the SDK's `search` param (address or keyword).
 * - Cross-service duplicates are merged via `dedupeBridgeableAssets` so an
 *   asset reachable through multiple services (e.g. MARKR + AVALANCHE_CCT)
 *   appears once.
 * - Portfolio balances are merged in so user-held tokens show their balance.
 */
export const useSwapTokens = (
  targetCaip2Id: string,
  searchText?: string
): UseSwapTokensResult => {
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const [selectedFromToken] = useSwapSelectedFromToken()
  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const hasSolanaAddress = useSelector(selectActiveAccountHasSolanaAddress)
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)

  // Block Solana targets when the user lacks a Solana address or the swap
  // module's Solana kill switch is on. Belt-and-suspenders with the
  // `useSupportedChains` filter that hides Solana from the network tabs.
  const isSolanaBlocked = useMemo(
    () =>
      isSvmChainId(targetCaip2Id) && (!hasSolanaAddress || isSolanaSwapBlocked),
    [targetCaip2Id, hasSolanaAddress, isSolanaSwapBlocked]
  )

  const targetChainId = useMemo(
    () => (targetCaip2Id ? getChainIdFromCaip2(targetCaip2Id) : undefined),
    [targetCaip2Id]
  )

  const { tokens: portfolioTokens } = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    targetChainId
  )

  const sourceAsset = useMemo(
    () =>
      selectedFromToken ? toFusionSourceAsset(selectedFromToken) : undefined,
    [selectedFromToken]
  )

  const sourceChainId = useMemo(
    () =>
      selectedFromToken
        ? (getCaip2ChainId(selectedFromToken.networkChainId) as Caip2ChainId)
        : undefined,
    [selectedFromToken]
  )

  // SDK-side search: address or keyword. Use a stable `undefined` for empty
  // searches so the query key doesn't churn while typing too few characters.
  const searchParam: AssetSearchQuery | undefined = useMemo(() => {
    const trimmed = searchText?.trim() ?? ''
    if (trimmed.length < 2) return EMPTY_SEARCH
    return isAddressLikeSearch(trimmed, isDeveloperMode)
      ? { type: 'address', value: trimmed }
      : { type: 'keyword', value: trimmed }
  }, [searchText, isDeveloperMode])

  const query = useInfiniteQuery({
    queryKey: [
      ReactQueryKeys.FUSION_TOKENS,
      sourceChainId,
      targetCaip2Id,
      isSolanaBlocked,
      sourceAsset,
      searchParam
    ],
    queryFn: async ({
      pageParam
    }): Promise<GetBridgeableAssetsResult | null> => {
      // enabled guard ensures these are defined before queryFn runs
      const asset = sourceAsset as Asset
      const srcChainId = sourceChainId as Caip2ChainId
      return FusionService.getBridgeableAssets({
        sourceAsset: asset,
        sourceChainId: srcChainId,
        targetChainId: targetCaip2Id as Caip2ChainId,
        page: pageParam as number,
        limit: PAGE_LIMIT,
        search: searchParam
      })
    },
    initialPageParam: 1,
    getNextPageParam: lastPage =>
      lastPage?.meta.hasMore ? lastPage.meta.nextPage : undefined,
    enabled:
      isFusionServiceReady &&
      !!sourceAsset &&
      !!sourceChainId &&
      !!targetCaip2Id &&
      !isSolanaBlocked,
    staleTime: STALE_TIME
  })

  const tokens = useMemo((): LocalTokenWithBalance[] => {
    if (!targetChainId || !query.data) return []

    const allAssets = query.data.pages.flatMap(page => page?.assets ?? [])
    const dedupedAssets = dedupeBridgeableAssets(allAssets)

    const balanceMap = new Map<string, LocalTokenWithBalance>()
    portfolioTokens?.forEach(token => {
      if (token.localId) {
        balanceMap.set(token.localId.toLowerCase(), token)
      }
    })

    return dedupedAssets.map(asset => {
      const localId = getLocalIdFromAsset(asset)
      const balanceData = balanceMap.get(localId.toLowerCase())
      return mapSdkAssetToLocal(asset, targetChainId, balanceData)
    })
  }, [query.data, portfolioTokens, targetChainId])

  // Report loading while FusionService is still initializing AND we have
  // everything else needed to fetch — otherwise `query.isLoading` is false
  // while the query is disabled, and the consumer would flash an empty state
  // ("No tokens found") before the query is ever enabled.
  const isWaitingOnFusionService =
    !isFusionServiceReady &&
    !!sourceAsset &&
    !!sourceChainId &&
    !!targetCaip2Id &&
    !isSolanaBlocked

  return {
    tokens,
    isLoading: query.isLoading || isWaitingOnFusionService,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage
  }
}
