import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { Network } from '@avalabs/core-chains-sdk'
import {
  ActivityIndicator,
  Icons,
  SCREEN_WIDTH,
  SearchBar,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreenRef, ListScreenV2 } from 'common/components/ListScreenV2'
import { NetworkFilterChips } from 'common/components/NetworkFilterChips'
import { useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { ListRenderItem } from '@shopify/flash-list'
import { LocalTokenWithBalance } from 'store/balance'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { useDebounce } from 'hooks/useDebounce'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useFilteredSwapTokens } from '../hooks/useFilteredSwapTokens'
import { useSwapTokens } from '../hooks/useSwapTokens'
import { useTestnetToTokens } from '../hooks/useTestnetToTokens'
import { getTokenKey } from '../utils/tokenKey'
import { tokenMatchesSearch } from '../utils/tokenMatchesSearch'

type UnverifiedDivider = { type: 'unverifiedDivider' }
type SwapTokenListItem = LocalTokenWithBalance | UnverifiedDivider

const UNVERIFIED_DIVIDER: UnverifiedDivider = { type: 'unverifiedDivider' }

const isDivider = (item: SwapTokenListItem): item is UnverifiedDivider =>
  'type' in item && item.type === 'unverifiedDivider'

export const SelectToSwapTokenScreen = ({
  selectedToken,
  setSelectedToken,
  defaultNetworkChainId,
  hideZeroBalance = false,
  networks,
  tokenFilter
}: {
  selectedToken: LocalTokenWithBalance | undefined
  setSelectedToken: (token: LocalTokenWithBalance) => void
  defaultNetworkChainId?: number
  hideZeroBalance?: boolean
  networks: Network[] | undefined
  tokenFilter?: (
    token: LocalTokenWithBalance,
    selectedNetwork: Network | undefined
  ) => boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [searchText, setSearchText] = useState<string>('')
  const { debounced: debouncedSearchText } = useDebounce(searchText, 300)

  // Selected network state (default to first network or provided default)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(
    undefined
  )

  // Set default network once when networks are loaded
  useEffect(() => {
    if (!networks || networks.length === 0) return

    if (defaultNetworkChainId) {
      const found = networks.find(n => n.chainId === defaultNetworkChainId)
      setSelectedNetwork(found ?? networks[0])
    } else {
      setSelectedNetwork(networks[0])
    }
  }, [defaultNetworkChainId, networks])

  // Get CAIP2 ID for selected network
  const caip2Id = useMemo(() => {
    if (selectedNetwork) {
      return getCaip2ChainId(selectedNetwork.chainId)
    }
    return ''
  }, [selectedNetwork])

  // Mainnet: paginated token list from token aggregator API
  const {
    tokens: mainnetTokens,
    isLoading: isLoadingMainnet,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useSwapTokens(isDeveloperMode ? '' : caip2Id, debouncedSearchText)

  // Testnet: SDK-driven list via getBridgeableAssets (small set, no pagination)
  const { tokens: testnetTokens, isLoading: isLoadingTestnet } =
    useTestnetToTokens(isDeveloperMode ? caip2Id : '')

  // Mainnet search is handled server-side via useSwapTokens; testnet needs
  // client-side filtering since the SDK list is fetched in full without pagination.
  const filteredTestnetTokens = useMemo(
    () =>
      testnetTokens.filter(t =>
        tokenMatchesSearch(t, debouncedSearchText, isDeveloperMode)
      ),
    [testnetTokens, debouncedSearchText, isDeveloperMode]
  )

  const tokens = isDeveloperMode ? filteredTestnetTokens : mainnetTokens
  const isLoadingTokens = isDeveloperMode ? isLoadingTestnet : isLoadingMainnet

  // Filter and sort tokens
  const baseResults = useFilteredSwapTokens({
    tokens,
    hideZeroBalance
  })
  const results = useMemo(() => {
    const filtered = tokenFilter
      ? baseResults.filter(t => tokenFilter(t, selectedNetwork))
      : baseResults

    // Wait until loading is done so the selected token and the rest of the list
    // appear at the same time, avoiding a flash where the pinned token shows alone
    if (
      !selectedToken ||
      selectedToken.networkChainId !== selectedNetwork?.chainId ||
      isLoadingTokens
    )
      return filtered

    // Don't pin the selected token if it doesn't match the current search text
    if (
      !tokenMatchesSearch(selectedToken, debouncedSearchText, isDeveloperMode)
    )
      return filtered

    // Pin the selected token to the top. Match against the list by localId +
    // networkChainId rather than getTokenKey: a token selected from another
    // source (portfolio, a previous session) can carry a different internalId
    // than its counterpart in this API-driven list, so a getTokenKey comparison
    // fails to dedupe and the token renders twice. Prefer the list's own object
    // when present (keeps its key consistent with the rest of the list); only
    // fall back to the external selected token when it isn't in the list.
    const matchIndex = filtered.findIndex(
      t =>
        t.localId === selectedToken.localId &&
        t.networkChainId === selectedToken.networkChainId
    )
    const pinned = matchIndex === -1 ? undefined : filtered[matchIndex]
    if (!pinned) return [selectedToken, ...filtered]
    return [
      pinned,
      ...filtered.slice(0, matchIndex),
      ...filtered.slice(matchIndex + 1)
    ]
  }, [
    baseResults,
    tokenFilter,
    selectedNetwork,
    selectedToken,
    isLoadingTokens,
    debouncedSearchText,
    isDeveloperMode
  ])

  // Track the divider row's y position within FlashList content so the sticky
  // overlay banner can fade in once it scrolls behind the sticky header.
  // NOTE: `onLayout` on a FlashList row reports y relative to the cell wrapper
  // (it's always ~0), not relative to FlashList content. We use FlashList's
  // ref-exposed `getLayout(index)` instead, which returns the correct content y.
  const flatListRef = useRef<ListScreenRef<SwapTokenListItem> | null>(null)
  const [dividerContentY, setDividerContentY] = useState<number>(0)

  // Group tokens verified-first with an "Unverified tokens" divider before the
  // unverified group. The pinned selected token (if any) stays at the very top
  // regardless of verification, then the rest is grouped. A null/undefined
  // isVerified is treated as verified — matches Core extension behavior and
  // covers chains where the backend doesn't yet populate the field. Tokens
  // the user already holds (balance > 0) are also treated as verified — they
  // own it, so surfacing the "unverified" warning would just add noise.
  const groupedResults = useMemo((): SwapTokenListItem[] => {
    if (results.length === 0) return results

    const head =
      selectedToken &&
      results[0]?.localId === selectedToken.localId &&
      results[0]?.networkChainId === selectedToken.networkChainId
        ? results.slice(0, 1)
        : []
    const rest = head.length > 0 ? results.slice(1) : results

    const verified: LocalTokenWithBalance[] = []
    const unverified: LocalTokenWithBalance[] = []
    for (const token of rest) {
      if (token.isVerified === false && !(token.balance > 0n))
        unverified.push(token)
      else verified.push(token)
    }

    if (unverified.length === 0) return [...head, ...verified]
    return [...head, ...verified, UNVERIFIED_DIVIDER, ...unverified]
  }, [results, selectedToken])

  const dividerIndexInData = useMemo(
    () => groupedResults.findIndex(isDivider),
    [groupedResults]
  )

  // Pull the divider's actual content y via FlashList's ref. ListScreenV2
  // prepends a HEADER_SENTINEL at index 0 of the FlashList data, so the
  // divider's FlashList index = its index in groupedResults + 1.
  const refreshDividerContentY = useCallback(() => {
    const flashList = flatListRef.current?.scrollViewRef?.current
    if (!flashList) return
    if (dividerIndexInData < 0) {
      setDividerContentY(prev => (prev === 0 ? prev : 0))
      return
    }
    const layout = flashList.getLayout(dividerIndexInData + 1)
    if (!layout || !layout.y) return
    setDividerContentY(prev => (prev === layout.y ? prev : layout.y))
  }, [dividerIndexInData])

  // Re-measure when the list shape changes (pagination, search, etc.).
  // If the layout isn't ready yet, the divider's own onLayout callback will
  // catch the miss.
  useEffect(() => {
    refreshDividerContentY()
  }, [refreshDividerContentY, groupedResults.length])

  // The divider row's onLayout fires when it (re)renders — the moment its
  // layout is guaranteed to be known by FlashList. Use it to refresh the y.
  const handleDividerLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      refreshDividerContentY()
    },
    [refreshDividerContentY]
  )

  // Handle token selection
  const handleSelectToken = useCallback(
    (token: LocalTokenWithBalance) => {
      setSelectedToken(token)
      canGoBack() && back()
    },
    [setSelectedToken, canGoBack, back]
  )

  // Stop paginating if a completed page fetch didn't add any new filtered results.
  // This prevents an infinite fetch loop when a restrictive tokenFilter means
  // only 1–2 tokens pass (e.g. BTC.b only), causing onEndReached to fire immediately.
  const resultsLengthBeforeFetchRef = useRef<number | null>(null)
  const stopPaginatingRef = useRef(false)

  useEffect(() => {
    stopPaginatingRef.current = false
    resultsLengthBeforeFetchRef.current = null
  }, [caip2Id, debouncedSearchText])

  useEffect(() => {
    if (!isFetchingNextPage && resultsLengthBeforeFetchRef.current !== null) {
      if (results.length === resultsLengthBeforeFetchRef.current) {
        stopPaginatingRef.current = true
      }
      resultsLengthBeforeFetchRef.current = null
    }
  }, [isFetchingNextPage, results.length])

  // Handle end reached for infinite scroll pagination
  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || stopPaginatingRef.current) return
    resultsLengthBeforeFetchRef.current = results.length
    fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, results.length])

  // Render footer spinner while fetching next page
  const renderListFooter = useCallback(() => {
    if (!isFetchingNextPage) return null
    return <ActivityIndicator sx={{ paddingVertical: 16 }} />
  }, [isFetchingNextPage])

  // Render network tabs
  const renderNetworkSelector = useCallback(
    () => (
      <NetworkFilterChips
        networks={networks}
        selectedNetwork={selectedNetwork}
        onSelectNetwork={setSelectedNetwork}
      />
    ),
    [networks, selectedNetwork]
  )

  // Render token item
  const renderItem: ListRenderItem<SwapTokenListItem> = useCallback(
    ({ item, index }) => {
      if (isDivider(item)) {
        // onLayout reports the divider's position within FlashList content;
        // we use that to drive the sticky overlay banner shown above the list.
        return (
          <View
            onLayout={handleDividerLayout}
            testID="unverified_tokens_divider"
            sx={{
              paddingHorizontal: 16,
              paddingTop: 32,
              paddingBottom: 8,
              backgroundColor: '$surfacePrimary'
            }}>
            <Text variant="heading3" sx={{ color: '$textPrimary' }}>
              Unverified tokens
            </Text>
          </View>
        )
      }

      const isSelected =
        selectedToken?.localId === item.localId &&
        selectedToken.networkChainId === item.networkChainId
      const nextItem = groupedResults[index + 1]
      const isLastItem = index === groupedResults.length - 1
      // Skip the row separator when the next item is the unverified divider —
      // the divider already provides visual separation.
      const showSeparator = !isLastItem && !(nextItem && isDivider(nextItem))

      return (
        <TouchableOpacity
          onPress={() => handleSelectToken(item)}
          sx={{ marginTop: 10, paddingLeft: 16 }}>
          <View
            sx={{
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingRight: 16
            }}>
            <View sx={{ flexDirection: 'row', gap: 10 }}>
              <LogoWithNetwork
                token={item}
                outerBorderColor={colors.$surfaceSecondary}
              />
              <View>
                <Text
                  testID={`token_selector__${item.symbol}`}
                  variant="buttonMedium"
                  numberOfLines={1}
                  sx={{ width: SCREEN_WIDTH * 0.65 }}>
                  {item.name}
                </Text>
                <Text variant="subtitle2">
                  {item.balanceDisplayValue} {item.symbol}
                </Text>
              </View>
            </View>
            {isSelected && (
              <Icons.Custom.CheckSmall color={colors.$textPrimary} />
            )}
          </View>
          {showSeparator && (
            <Separator
              sx={{
                marginTop: 10,
                marginLeft: 46,
                width: '100%'
              }}
            />
          )}
        </TouchableOpacity>
      )
    },
    [
      selectedToken,
      groupedResults,
      handleSelectToken,
      colors,
      handleDividerLayout
    ]
  )

  // Sticky overlay banner that appears once the divider scrolls into the
  // sticky header area. Uses tighter top padding than the in-list divider
  // since the header above already provides visual separation.
  const headerOverlay = useMemo(() => {
    if (dividerContentY <= 0) return undefined
    return {
      triggerContentY: dividerContentY,
      render: () => (
        <View
          sx={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 12,
            backgroundColor: '$surfacePrimary'
          }}>
          <Text variant="heading3" sx={{ color: '$textPrimary' }}>
            Unverified tokens
          </Text>
        </View>
      )
    }
  }, [dividerContentY])

  // Render header with search and network selector
  const renderHeader = useCallback(
    () => (
      <View sx={{ gap: 12 }}>
        <SearchBar onTextChanged={setSearchText} searchText={searchText} />
        {renderNetworkSelector()}
      </View>
    ),
    [searchText, renderNetworkSelector]
  )

  const renderEmpty = useCallback(() => {
    // Show loading if:
    // - Networks not loaded yet
    // - Network not selected yet (initializing)
    // - Token data is loading
    if (!networks || !selectedNetwork || isLoadingTokens) {
      return <ActivityIndicator />
    }
    return <ErrorState icon={undefined} title="No tokens found" />
  }, [networks, selectedNetwork, isLoadingTokens])

  return (
    <ListScreenV2
      flatListRef={flatListRef}
      title="Select a token"
      data={groupedResults}
      isModal
      renderItem={renderItem}
      keyExtractor={(item: SwapTokenListItem) =>
        isDivider(item) ? 'unverified-tokens-divider' : getTokenKey(item)
      }
      getItemType={(item: SwapTokenListItem) =>
        isDivider(item) ? 'divider' : 'token'
      }
      headerOverlay={headerOverlay}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      renderListFooter={renderListFooter}
    />
  )
}
