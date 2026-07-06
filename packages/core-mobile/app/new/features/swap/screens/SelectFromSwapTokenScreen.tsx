import React, { useMemo, useState, useCallback, useEffect } from 'react'
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
import { ListScreenV2 } from 'common/components/ListScreenV2'
import { NetworkFilterChips } from 'common/components/NetworkFilterChips'
import { useRouter } from 'expo-router'
import { LogoWithNetwork } from 'features/portfolio/assets/components/LogoWithNetwork'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { ListRenderItem } from '@shopify/flash-list'
import { LocalTokenWithBalance } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useFilteredSwapTokens } from '../hooks/useFilteredSwapTokens'
import { tokenMatchesSearch } from '../utils/tokenMatchesSearch'

/**
 * Token selection screen for the "from" side of a swap.
 *
 * Uses the user's portfolio directly — no API call, client-side search.
 * Only shows tokens the user actually owns (non-zero balance).
 */
export const SelectFromSwapTokenScreen = ({
  selectedToken,
  setSelectedToken,
  defaultNetworkChainId,
  networks,
  tokenFilter
}: {
  selectedToken: LocalTokenWithBalance | undefined
  setSelectedToken: (token: LocalTokenWithBalance) => void
  defaultNetworkChainId?: number
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
  const [searchText, setSearchText] = useState<string>('')
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(
    undefined
  )

  const activeAccount = useSelector(selectActiveAccount)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  useEffect(() => {
    if (!networks || networks.length === 0) return
    if (defaultNetworkChainId) {
      const found = networks.find(n => n.chainId === defaultNetworkChainId)
      setSelectedNetwork(found ?? networks[0])
    } else {
      setSelectedNetwork(networks[0])
    }
  }, [defaultNetworkChainId, networks])

  const { tokens: portfolioTokens, isLoading: isBalanceLoading } =
    useTokensWithBalanceByNetworkForAccount(
      activeAccount,
      selectedNetwork?.chainId
    )

  // Apply visibility/chain/zero-balance filtering
  const filteredTokens = useFilteredSwapTokens({
    tokens: portfolioTokens,
    hideZeroBalance: true
  })

  // Client-side text search against portfolio (small set, no API needed)
  const searchedResults = useMemo(() => {
    if (searchText.trim().length === 0) return filteredTokens
    return filteredTokens.filter(token =>
      tokenMatchesSearch(token, searchText, isDeveloperMode)
    )
  }, [filteredTokens, searchText, isDeveloperMode])

  const results = useMemo(
    () =>
      tokenFilter
        ? searchedResults.filter(t => tokenFilter(t, selectedNetwork))
        : searchedResults,
    [searchedResults, tokenFilter, selectedNetwork]
  )

  const handleSelectToken = useCallback(
    (token: LocalTokenWithBalance) => {
      setSelectedToken(token)
      canGoBack() && back()
    },
    [setSelectedToken, canGoBack, back]
  )

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
    if (!networks || !selectedNetwork || isBalanceLoading) {
      return <ActivityIndicator />
    }
    return <ErrorState icon={undefined} title="No tokens found" />
  }, [networks, selectedNetwork, isBalanceLoading])

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
    />
  )
}
