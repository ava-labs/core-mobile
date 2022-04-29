import React, { useMemo, useState } from 'react'
import { FlatList, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import SearchBar from 'components/SearchBar'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import ZeroState from 'components/ZeroState'
import { NetworkListItem } from 'screens/network/NetworkListItem'
import { Network } from 'repository/NetworksRepo'
import { ShowSnackBar } from 'components/Snackbar'
import { getIcon } from 'screens/network/NetworkIconSelector'

type Props = {
  onShowInfo: (network: Network) => void
}

export default function NetworkManager({ onShowInfo }: Props) {
  const { theme, repo } = useApplicationContext()
  const [searchText, setSearchText] = useState('')
  const { networks, setFavorite, unsetFavorite } = repo.networksRepo

  const mainNets = useMemo(
    () =>
      Object.values(networks)
        .filter(network => !network.isTest)
        .filter(network =>
          network.name.toLowerCase().includes(searchText.toLowerCase())
        ),
    [networks, searchText]
  )
  const testNets = useMemo(
    () =>
      Object.values(networks)
        .filter(network => network.isTest)
        .filter(network =>
          network.name.toLowerCase().includes(searchText.toLowerCase())
        ),
    [networks, searchText]
  )
  const favorites = useMemo(
    () =>
      Object.values(networks)
        .filter(network => network.isFavorite)
        .filter(network =>
          network.name.toLowerCase().includes(searchText.toLowerCase())
        ),
    [networks, searchText]
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

  function toggleFavorite(networkName: string) {
    const network = networks[networkName]
    network.isFavorite ? unsetFavorite(network) : setFavorite(network)
  }

  function showInfo(networkName: string) {
    const network = networks[networkName]
    onShowInfo(network)
  }

  function connect(networkName: string) {
    //TODO
    ShowSnackBar('Will connect to ' + networkName)
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
            renderItem={info => (
              <NetworkListItem
                onPress={connect}
                networkName={info.item.name}
                icon={getIcon(info.item.name, 32)} //TODO: set real url
                isFavorite={info.item.isFavorite}
                onFavorite={toggleFavorite}
                onInfo={showInfo}
              />
            )}
            keyExtractor={item => item.name}
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
            renderItem={info => (
              <NetworkListItem
                onPress={connect}
                networkName={info.item.name}
                icon={getIcon(info.item.name, 32)} //TODO: set real url
                isFavorite={info.item.isFavorite}
                onFavorite={toggleFavorite}
                onInfo={showInfo}
              />
            )}
            keyExtractor={item => item.name}
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
            renderItem={info => (
              <NetworkListItem
                onPress={connect}
                networkName={info.item.name}
                icon={getIcon(info.item.name, 32)} //TODO: set real url
                isFavorite={info.item.isFavorite}
                onFavorite={toggleFavorite}
                onInfo={showInfo}
              />
            )}
            keyExtractor={item => item.name}
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
