import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { ScrollView } from 'react-native'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import {
  ActivityIndicator,
  Button,
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
import { ListScreenV2 } from 'common/components/ListScreenV2'
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

  const tokens = isDeveloperMode ? testnetTokens : mainnetTokens
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

    // Pin the selected token to the top, deduplicating if it already appears in the list
    const selectedKey = getTokenKey(selectedToken)
    const withoutSelected = filtered.filter(t => getTokenKey(t) !== selectedKey)
    return [selectedToken, ...withoutSelected]
  }, [
    baseResults,
    tokenFilter,
    selectedNetwork,
    selectedToken,
    isLoadingTokens,
    debouncedSearchText,
    isDeveloperMode
  ])

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
  const renderNetworkSelector = useCallback(() => {
    if (!networks || networks.length <= 1) return null

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}>
        {networks.map(network => (
          <Button
            key={network.chainId}
            testID={`network_selector__${network.chainName}`}
            size="small"
            type={
              network.chainId === selectedNetwork?.chainId
                ? 'primary'
                : 'secondary'
            }
            onPress={() => setSelectedNetwork(network)}
            style={{ flexShrink: 0 }}>
            {network.chainId === ChainId.AVALANCHE_MAINNET_ID
              ? 'Avalanche (C-Chain)'
              : network.chainId === ChainId.AVALANCHE_TESTNET_ID
              ? 'Avalanche (C-Chain Testnet)'
              : network.chainName}
          </Button>
        ))}
      </ScrollView>
    )
  }, [networks, selectedNetwork])

  // Render token item
  const renderItem: ListRenderItem<LocalTokenWithBalance> = useCallback(
    ({ item, index }) => {
      const isSelected =
        selectedToken?.localId === item.localId &&
        selectedToken.networkChainId === item.networkChainId
      const isLastItem = index === results.length - 1

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
          {!isLastItem && (
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
    [selectedToken, results.length, handleSelectToken, colors]
  )

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
      title="Select a token"
      data={results}
      isModal
      renderItem={renderItem}
      keyExtractor={(item: LocalTokenWithBalance) =>
        `token-${item.localId}-${item.networkChainId}`
      }
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      renderListFooter={renderListFooter}
    />
  )
}
