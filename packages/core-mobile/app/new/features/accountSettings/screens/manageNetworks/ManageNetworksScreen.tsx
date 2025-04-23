import { Network } from '@avalabs/core-chains-sdk'
import {
  Icons,
  Pressable,
  SearchBar,
  Text,
  Toggle,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { useFocusEffect, useNavigation, useRouter } from 'expo-router'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { useCallback, useMemo, useState } from 'react'
import { FlatList, ListRenderItem } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import {
  alwaysFavoriteNetworks,
  FAVORITE_NETWORKS,
  toggleFavorite
} from 'store/network'

export const ManageNetworksScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { networks, favoriteNetworks, customNetworks } = useNetworks()
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const title = 'Networks'
  const { getParent } = useNavigation()
  const { navigate } = useRouter()

  const filterBySearchText = useCallback(
    (network: Network) =>
      network.chainName.toLowerCase().includes(searchText.toLowerCase()),
    [searchText]
  )

  const visibleNetworks = useMemo(() => {
    const main = Object.values(networks).filter(network =>
      FAVORITE_NETWORKS.includes(network.chainId)
    )

    const enabled = Object.values(networks).filter(
      network =>
        favoriteNetworks.some(n => n.chainId === network.chainId) &&
        !main.some(n => n.chainId === network.chainId)
    )

    const custom = Object.values(networks).filter(network =>
      Object.values(customNetworks)
        .map(n => n.chainId)
        .includes(network.chainId)
    )

    return [...main, ...enabled, ...custom]
  }, [networks, favoriteNetworks, customNetworks])

  const filteredNetworks = useMemo(() => {
    if (searchText.length) {
      return Object.values([
        ...Object.values(networks),
        ...Object.values(customNetworks)
      ])
        .filter(network => filterBySearchText(network))
        .sort(sortNetworks)
    }
    return visibleNetworks.sort(sortNetworks)
  }, [
    searchText.length,
    visibleNetworks,
    networks,
    customNetworks,
    filterBySearchText
  ])

  const onFavorite = useCallback(
    (item: Network) => {
      dispatch(toggleFavorite(item.chainId))
    },
    [dispatch]
  )

  const renderNetwork: ListRenderItem<Network> = ({
    item,
    index
  }): JSX.Element => {
    const isEnabled = favoriteNetworks.some(
      network => network.chainId === item.chainId
    )
    const isLast = index === filteredNetworks.length - 1

    return (
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          height: 62,
          paddingLeft: 16
        }}>
        <NetworkLogoWithChain
          network={item}
          networkSize={36}
          showChainLogo
          chainLogoSize={24}
          outerBorderColor={theme.colors.$surfacePrimary}
        />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            flexDirection: 'row',
            borderBottomWidth: isLast ? 0 : 0.5,
            height: '100%',
            borderColor: theme.colors.$borderPrimary,
            paddingRight: 16
          }}>
          <Text style={{ flex: 1 }}>{item.chainName}</Text>
          {!alwaysFavoriteNetworks.includes(item.chainId) && (
            <Toggle value={isEnabled} onValueChange={() => onFavorite(item)} />
          )}
        </View>
      </Pressable>
    )
  }

  const goToAddCustomNetwork = useCallback(() => {
    navigate('/accountSettings/manageNetworks/addCustomNetwork')
  }, [navigate])

  const renderHeaderRight = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={goToAddCustomNetwork}
        sx={{
          flexDirection: 'row',
          gap: 16,
          marginRight: 18,
          alignItems: 'center'
        }}>
        <Icons.Content.Add
          testID="add_custon_network_btn"
          width={25}
          height={25}
          color={theme.colors.$textPrimary}
        />
      </TouchableOpacity>
    )
  }, [theme.colors.$textPrimary, goToAddCustomNetwork])

  useFocusEffect(
    useCallback(() => {
      getParent()?.setOptions({
        headerRight: renderHeaderRight
      })
      return () => {
        getParent()?.setOptions({
          headerRight: undefined
        })
      }
    }, [getParent, renderHeaderRight])
  )

  return (
    <View
      style={{
        flex: 1
      }}>
      <View
        style={{
          paddingHorizontal: 16,
          gap: 16
        }}>
        <Text variant="heading2">{title}</Text>
        <SearchBar
          onTextChanged={setSearchText}
          searchText={searchText}
          testID="network_manager__search_input"
        />
      </View>
      <FlatList
        data={filteredNetworks}
        renderItem={renderNetwork}
        keyExtractor={item => item.chainId.toString()}
        contentContainerStyle={[
          {
            paddingBottom: insets.bottom
          },
          filteredNetworks.length === 0
            ? {
                justifyContent: 'center',
                flex: 1
              }
            : {
                paddingTop: 16
              }
        ]}
        ListEmptyComponent={
          <ErrorState title="No results" description="Try a different search" />
        }
      />
    </View>
  )
}

function sortNetworks(a: Network, b: Network): number {
  return a.chainName.localeCompare(b.chainName)
}
