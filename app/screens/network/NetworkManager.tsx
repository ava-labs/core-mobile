import React, { useMemo, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import {
  toggleFavorite,
  selectFavoriteNetworks,
  selectNetworks,
  setActive
} from 'store/network'
import { useApplicationContext } from 'contexts/ApplicationContext'
import SearchBar from 'components/SearchBar'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import ZeroState from 'components/ZeroState'
import { NetworkListItem } from 'screens/network/NetworkListItem'
import { Network } from '@avalabs/chains-sdk'

type Props = {
  onShowInfo: (network: Network) => void
}

export default function NetworkManager({ onShowInfo }: Props) {
  const networks = useSelector(selectNetworks)
  const favoriteNetworks = useSelector(selectFavoriteNetworks)
  const dispatch = useDispatch()
  const { theme } = useApplicationContext()
  const [searchText, setSearchText] = useState('')

  const mainNets = useMemo(
    () =>
      Object.values(networks)
        .filter(network => !network.isTestnet)
        .filter(network =>
          network.chainName.toLowerCase().includes(searchText.toLowerCase())
        ),
    [networks, searchText]
  )
  const testNets = useMemo(
    () =>
      Object.values(networks)
        .filter(network => network.isTestnet)
        .filter(network =>
          network.chainName.toLowerCase().includes(searchText.toLowerCase())
        ),
    [networks, searchText]
  )
  const favorites = useMemo(
    () =>
      favoriteNetworks.filter(network =>
        network.chainName.toLowerCase().includes(searchText.toLowerCase())
      ),
    [favoriteNetworks, searchText]
  )

  const renderCustomLabel = (title: string, selected: boolean) => {
    return selected ? (
      <AvaText.ButtonMedium
        ellipsizeMode={'tail'}
        textStyle={{
          color: theme.alternateBackground
        }}>
        {title}
      </AvaText.ButtonMedium>
    ) : (
      <AvaText.Body2 ellipsizeMode={'tail'} textStyle={{ lineHeight: 24 }}>
        {title}
      </AvaText.Body2>
    )
  }

  function showInfo(chainId: number) {
    const network = networks[chainId]
    onShowInfo(network)
  }

  function connect(chainId: number) {
    dispatch(setActive(chainId))
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
        icon={item.logoUri}
        isFavorite={isFavorite}
        onFavorite={() => dispatch(toggleFavorite(item.chainId))}
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
        Networks
      </AvaText.LargeTitleBold>
      <SearchBar onTextChanged={setSearchText} searchText={searchText} />
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <TabViewAva.Item title={'Favorites'}>
          <FlatList
            data={favorites}
            renderItem={renderNetwork}
            keyExtractor={item => item.chainId.toString()}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={
              <View style={{ marginVertical: 40 }}>
                <ZeroState.NoFavoriteNetworks />
              </View>
            }
          />
        </TabViewAva.Item>
        <TabViewAva.Item title={'Networks'}>
          <FlatList
            data={mainNets}
            renderItem={renderNetwork}
            keyExtractor={item => item.chainName}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={
              <View style={{ marginVertical: 40 }}>
                <ZeroState.NoFavoriteNetworks />
              </View>
            }
          />
        </TabViewAva.Item>
        <TabViewAva.Item title={'Testnets'}>
          <FlatList
            data={testNets}
            renderItem={renderNetwork}
            keyExtractor={item => item.chainId.toString()}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={
              <View style={{ marginVertical: 40 }}>
                <ZeroState.NoFavoriteNetworks />
              </View>
            }
          />
        </TabViewAva.Item>
      </TabViewAva>
    </View>
  )
}
