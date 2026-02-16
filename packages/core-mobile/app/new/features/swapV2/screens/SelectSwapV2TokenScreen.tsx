import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
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
import { useFilteredSwapTokens } from '../hooks/useFilteredSwapTokens'
import { useSwapV2Tokens } from '../hooks/useSwapV2Tokens'
import { useSupportedChains } from '../hooks/useSupportedChains'

export const SelectSwapV2TokenScreen = ({
  selectedToken,
  setSelectedToken,
  defaultNetworkChainId,
  hideZeroBalance = false
}: {
  selectedToken: LocalTokenWithBalance | undefined
  setSelectedToken: (token: LocalTokenWithBalance) => void
  defaultNetworkChainId?: number
  hideZeroBalance?: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { back, canGoBack } = useRouter()
  const [searchText, setSearchText] = useState<string>('')

  // Get dynamically supported networks from Fusion SDK
  const { chains: networks } = useSupportedChains()

  // Selected network state (default to first network or provided default)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(
    undefined
  )

  // Track if we've set the default network
  const hasSetDefaultNetwork = useRef(false)

  // Set default network once when networks are loaded
  useEffect(() => {
    if (!networks || networks.length === 0 || hasSetDefaultNetwork.current)
      return

    if (defaultNetworkChainId) {
      const found = networks.find(n => n.chainId === defaultNetworkChainId)
      setSelectedNetwork(found ?? networks[0])
    } else {
      setSelectedNetwork(networks[0])
    }

    hasSetDefaultNetwork.current = true
  }, [defaultNetworkChainId, networks])

  // Get CAIP2 ID for selected network
  const caip2Id = useMemo(() => {
    if (selectedNetwork) {
      return getCaip2ChainId(selectedNetwork.chainId)
    }
    return ''
  }, [selectedNetwork])

  // Lazy load tokens for selected network (with balance data merged)
  const { tokens, isLoading } = useSwapV2Tokens(caip2Id)

  // Filter and sort tokens
  const results = useFilteredSwapTokens({ tokens, searchText, hideZeroBalance })

  // Handle token selection
  const handleSelectToken = useCallback(
    (token: LocalTokenWithBalance) => {
      setSelectedToken(token)
      canGoBack() && back()
    },
    [setSelectedToken, canGoBack, back]
  )

  // Render network tabs
  const renderNetworkSelector = useCallback(() => {
    if (!networks || networks.length <= 1) return null

    return (
      <View
        sx={{
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'flex-start'
        }}>
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
              : network.chainName}
          </Button>
        ))}
      </View>
    )
  }, [networks, selectedNetwork])

  // Render token item
  const renderItem: ListRenderItem<LocalTokenWithBalance> = useCallback(
    ({ item, index }) => {
      const isSelected = selectedToken?.localId === item.localId
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
    if (isLoading) {
      return <ActivityIndicator />
    }
    return <ErrorState icon={undefined} title="No tokens found" />
  }, [isLoading])

  return (
    <ListScreenV2
      title="Select a token"
      data={results}
      isModal
      renderItem={renderItem}
      estimatedItemSize={66}
      keyExtractor={(item: LocalTokenWithBalance) =>
        `token-${item.localId}-${item.internalId}`
      }
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
    />
  )
}
