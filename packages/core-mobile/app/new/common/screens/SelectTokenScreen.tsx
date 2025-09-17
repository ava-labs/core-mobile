import { Network } from '@avalabs/core-chains-sdk'
import { Button, SearchBar, View } from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { ListScreen } from 'common/components/ListScreen'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Keyboard, Platform } from 'react-native'

export const SelectTokenScreen = <T extends object>({
  tokens,
  searchText,
  onSearchText,
  renderListItem,
  keyExtractor,
  renderEmpty,
  networks = [],
  networkChainId
}: {
  tokens: T[]
  searchText: string
  onSearchText: (value: string) => void
  renderListItem: ListRenderItem<T>
  keyExtractor?: (item: T) => string
  renderEmpty?: () => React.ReactNode
  networks?: Network[]
  networkChainId?: number
}): JSX.Element => {
  const [selectedNetworkFilter, setSelectedNetworkFilter] =
    useState<NetworkFilter>(ALL_NETWORKS)
  const filteredTokens = useMemo(
    () =>
      tokens.filter(token => {
        if (selectedNetworkFilter === ALL_NETWORKS) {
          return true
        } else if (
          'networkChainId' in token &&
          typeof selectedNetworkFilter !== 'string'
        ) {
          return token.networkChainId === selectedNetworkFilter.chainId
        }
      }),
    [tokens, selectedNetworkFilter]
  )

  const renderNetwork = useCallback(
    ({ item }: { item: NetworkFilter }) => {
      return (
        <Button
          testID={
            typeof item === 'string'
              ? `network_selector__${item}`
              : `network_selector__${item.chainName}`
          }
          size="small"
          type={item === selectedNetworkFilter ? 'primary' : 'secondary'}
          hitSlop={8}
          onPress={() => setSelectedNetworkFilter(item)}>
          {typeof item === 'string' ? item : item.chainName}
        </Button>
      )
    },
    [selectedNetworkFilter]
  )

  const renderNetworkSelector = useCallback(() => {
    if (networks.length === 0) {
      return
    }

    return (
      <FlatList
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[ALL_NETWORKS, ...networks]}
        renderItem={renderNetwork}
      />
    )
  }, [networks, renderNetwork])

  const renderHeader = useCallback(() => {
    return (
      <View sx={{ gap: 12 }}>
        <SearchBar onTextChanged={onSearchText} searchText={searchText} />
        {renderNetworkSelector()}
      </View>
    )
  }, [onSearchText, searchText, renderNetworkSelector])

  useEffect(() => {
    if (networkChainId) {
      const network = networks.find(n => n.chainId === networkChainId)
      if (network) {
        setSelectedNetworkFilter(network)
      }
    }
  }, [networkChainId, networks])

  useEffect(() => {
    // (Android) native screens need to dismiss the keyboard when the screen is focused
    if (Platform.OS === 'android' && Keyboard.isVisible()) {
      Keyboard.dismiss()
    }
  }, [])

  return (
    <ListScreen
      title="Select a token"
      data={filteredTokens}
      isModal
      // @ts-ignore TODO: ListScreen improvement
      renderItem={renderListItem}
      keyExtractor={keyExtractor}
      renderHeader={renderHeader}
      renderEmpty={renderEmpty}
    />
  )
}

const ALL_NETWORKS = 'All networks'
type NetworkFilter = Network | string
