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
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ListRenderItem } from '@shopify/flash-list'
import { useSelector } from 'react-redux'
import { LocalTokenWithBalance } from 'store/balance'
import { selectIsSolanaSwapBlocked } from 'store/posthog'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { useFilteredSwapTokens } from '../hooks/useFilteredSwapTokens'
import { useSwapV2Tokens } from '../hooks/useSwapV2Tokens'

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

  // Get available networks
  const cChainNetwork = useCChainNetwork()
  const solanaNetwork = useSolanaNetwork()
  const isSolanaSwapBlocked = useSelector(selectIsSolanaSwapBlocked)

  // Network list
  const networks = useMemo(() => {
    const list = [cChainNetwork]
    if (!isSolanaSwapBlocked && solanaNetwork) {
      list.push(solanaNetwork)
    }
    return list.filter(Boolean) as Network[]
  }, [cChainNetwork, solanaNetwork, isSolanaSwapBlocked])

  // Selected network state (default to C-Chain or provided default)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | undefined>(
    cChainNetwork
  )

  useEffect(() => {
    if (defaultNetworkChainId) {
      const found = networks.find(n => n.chainId === defaultNetworkChainId)
      setSelectedNetwork(found)
    }
  }, [defaultNetworkChainId, networks])

  // Get CAIP2 ID for selected network
  const caip2Id = useMemo(() => {
    if (selectedNetwork) {
      return getCaip2ChainId(selectedNetwork.chainId)
    }
    if (cChainNetwork) {
      return getCaip2ChainId(cChainNetwork.chainId)
    }
    return ''
  }, [selectedNetwork, cChainNetwork])

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
    if (networks.length <= 1) return null

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
