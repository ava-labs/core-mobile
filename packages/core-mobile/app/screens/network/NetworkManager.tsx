import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { ChainID, setActive, toggleFavorite } from 'store/network'
import SearchBar from 'components/SearchBar'
import AvaText from 'components/AvaText'
import ZeroState from 'components/ZeroState'
import { NetworkListItem } from 'screens/network/NetworkListItem'
import { Network } from '@avalabs/core-chains-sdk'
import { useNavigation } from '@react-navigation/native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { TabView } from 'components/TabView'

type Props = {
  onShowInfo: (chainId: ChainID) => void
}

export default function NetworkManager({ onShowInfo }: Props): JSX.Element {
  const { goBack } = useNavigation()
  const { networks, favoriteNetworks, customNetworks } = useNetworks()
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const title = 'Networks'

  const customNetworkChainIds = useMemo(
    () => Object.values(customNetworks).map(n => n.chainId),
    [customNetworks]
  )
  const filterBySearchText = useCallback(
    (network: Network) =>
      network.chainName.toLowerCase().includes(searchText.toLowerCase()),
    [searchText]
  )

  const filteredNetworks = useMemo(() => {
    return Object.values(networks)
      .filter(network => !customNetworkChainIds.includes(network.chainId))
      .filter(filterBySearchText)
      .sort(sortNetworks)
  }, [customNetworkChainIds, filterBySearchText, networks])

  const filteredCustomNetworks = useMemo(
    () =>
      Object.values(customNetworks)
        .filter(filterBySearchText)
        .sort(sortNetworks),
    [customNetworks, filterBySearchText]
  )
  const favorites = useMemo(
    () => favoriteNetworks.filter(filterBySearchText).sort(sortNetworks),
    [favoriteNetworks, filterBySearchText]
  )

  const renderCustomLabel = ({
    children,
    focused,
    color
  }: {
    children: string
    focused: boolean
    color: string
  }): JSX.Element => {
    return focused ? (
      <AvaText.ButtonMedium
        textStyle={{
          color
        }}>
        {children}
      </AvaText.ButtonMedium>
    ) : (
      <AvaText.Body2 ellipsizeMode={'tail'} textStyle={{ lineHeight: 24 }}>
        {children}
      </AvaText.Body2>
    )
  }

  const showInfo = useCallback(
    (chainId: number): void => {
      AnalyticsService.capture('NetworkDetailsClicked', { chainId })
      onShowInfo(chainId)
    },
    [onShowInfo]
  )

  const connect = useCallback(
    (chainId: number): void => {
      dispatch(setActive(chainId))
      goBack()
    },
    [dispatch, goBack]
  )

  const renderNetwork = useCallback(
    ({ item }: { item: Network }): JSX.Element => {
      const isFavorite = favoriteNetworks.some(
        network => network.chainId === item.chainId
      )

      return (
        <NetworkListItem
          onPress={connect}
          networkChainId={item.chainId}
          networkName={item.chainName}
          logoUri={item.logoUri}
          isFavorite={isFavorite}
          onFavorite={() => {
            dispatch(toggleFavorite(item.chainId))
          }}
          onInfo={showInfo}
        />
      )
    },
    [favoriteNetworks, connect, showInfo, dispatch]
  )

  const renderFavorites = useCallback(
    () => (
      <FlatList
        data={favorites}
        renderItem={renderNetwork}
        keyExtractor={item => item.chainId.toString()}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={{ marginVertical: 40 }}>
            <ZeroState.Basic
              title="No favorites"
              message="Select one from other two lists"
            />
          </View>
        }
      />
    ),
    [favorites, renderNetwork]
  )

  const renderNetworks = useCallback(
    () => (
      <FlatList
        testID="networks_tab_scroll_view"
        data={filteredNetworks}
        renderItem={renderNetwork}
        keyExtractor={item => item.chainName}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={{ marginVertical: 40 }}>
            <ZeroState.Basic title="Loading networks" />
          </View>
        }
      />
    ),
    [filteredNetworks, renderNetwork]
  )

  const renderCustomNetworks = useCallback(
    () => (
      <FlatList
        data={filteredCustomNetworks}
        renderItem={renderNetwork}
        keyExtractor={item => item.chainId.toString()}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={{ marginVertical: 40 }}>
            <ZeroState.Basic
              title="No custom networks"
              message="Click the + button to add a network"
            />
          </View>
        }
      />
    ),
    [filteredCustomNetworks, renderNetwork]
  )

  const tabScreens = [
    {
      name: 'Favorites',
      component: renderFavorites
    },
    {
      name: 'Networks',
      component: renderNetworks
    },
    {
      name: 'Custom',
      component: renderCustomNetworks
    }
  ]

  return (
    <View
      style={{
        flex: 1
      }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        {title}
      </AvaText.LargeTitleBold>
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        testID="network_manager__search_input"
      />
      <TabView tabScreens={tabScreens} renderCustomLabel={renderCustomLabel} />
    </View>
  )
}

function sortNetworks(a: Network, b: Network): number {
  return a.chainName.localeCompare(b.chainName)
}
