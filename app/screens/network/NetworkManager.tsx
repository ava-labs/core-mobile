import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import {
  ChainID,
  selectCustomNetworks,
  selectFavoriteNetworks,
  selectNetworks,
  setActive,
  toggleFavorite
} from 'store/network'
import SearchBar from 'components/SearchBar'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import ZeroState from 'components/ZeroState'
import { NetworkListItem } from 'screens/network/NetworkListItem'
import { Network } from '@avalabs/chains-sdk'
import { useNavigation } from '@react-navigation/native'
import { usePostCapture } from 'hooks/usePosthogCapture'

type Props = {
  onShowInfo: (chainId: ChainID) => void
}

export default function NetworkManager({ onShowInfo }: Props) {
  const { goBack } = useNavigation()
  const networks = useSelector(selectNetworks)
  const customNetworks = useSelector(selectCustomNetworks)
  const favoriteNetworks = useSelector(selectFavoriteNetworks)
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const { capture } = usePostCapture()
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

  const filteredNetworks = useMemo(
    () =>
      Object.values(networks)
        .filter(network => !customNetworkChainIds.includes(network.chainId))
        .filter(filterBySearchText)
        .sort(sortNetworks),
    [customNetworkChainIds, filterBySearchText, networks]
  )
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

  const renderCustomLabel = (
    label: string,
    selected: boolean,
    color: string
  ) => {
    return selected ? (
      <AvaText.ButtonMedium
        ellipsizeMode={'tail'}
        textStyle={{
          color
        }}>
        {label}
      </AvaText.ButtonMedium>
    ) : (
      <AvaText.Body2 ellipsizeMode={'tail'} textStyle={{ lineHeight: 24 }}>
        {label}
      </AvaText.Body2>
    )
  }

  function showInfo(chainId: number) {
    capture('NetworkDetailsClicked', { chainId })
    onShowInfo(chainId)
  }

  function connect(chainId: number) {
    dispatch(setActive(chainId))
    goBack()
  }

  const renderNetwork = ({ item }: { item: Network }) => {
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
  }

  return (
    <View
      style={{
        flex: 1
      }}>
      <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
        {title}
      </AvaText.LargeTitleBold>
      <SearchBar onTextChanged={setSearchText} searchText={searchText} />
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <TabViewAva.Item title="Favorites">
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
        </TabViewAva.Item>
        <TabViewAva.Item title={title}>
          <FlatList
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
        </TabViewAva.Item>
        <TabViewAva.Item title="Custom">
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
        </TabViewAva.Item>
      </TabViewAva>
    </View>
  )
}

function sortNetworks(a: Network, b: Network) {
  return a.chainName.localeCompare(b.chainName)
}
