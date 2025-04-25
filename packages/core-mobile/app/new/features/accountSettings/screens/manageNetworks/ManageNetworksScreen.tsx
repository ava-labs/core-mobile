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
  isAvalancheCChainId,
  isAvalancheChainId
} from 'services/network/utils/isAvalancheNetwork'
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
      network.chainName.toLowerCase().includes(searchText.toLowerCase()) ||
      network.chainId.toString().includes(searchText),
    [searchText]
  )

  const availableNetworks = useMemo(() => {
    const enabled = Object.values(networks)
      .filter(network => favoriteNetworks.includes(network))
      .sort((a, b) => {
        if (isAvalancheCChainId(a.chainId)) return -1
        if (isAvalancheCChainId(b.chainId)) return 1
        if (isAvalancheChainId(a.chainId)) return -1
        if (isAvalancheChainId(b.chainId)) return 1
        return 0
      })

    const disabled = Object.values(networks)
      .filter(network => !enabled.includes(network))
      .sort((a, b) => {
        if (
          customNetworks.includes(a) ||
          FAVORITE_NETWORKS.includes(a.chainId)
        ) {
          return -1
        }

        if (
          customNetworks.includes(b) ||
          FAVORITE_NETWORKS.includes(b.chainId)
        ) {
          return 1
        }
        return sortNetworks(a, b)
      })

    return [...enabled, ...disabled]
  }, [customNetworks, favoriteNetworks, networks])

  const filteredNetworks = useMemo(() => {
    if (searchText.length) {
      return availableNetworks.filter(filterBySearchText)
    }
    return availableNetworks
  }, [availableNetworks, filterBySearchText, searchText.length])

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
    const isCustomNetwork = Object.values(customNetworks).some(
      network => network.chainId === item.chainId
    )
    return (
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          height: 62,
          paddingLeft: 16
        }}
        onPress={() => goToNetwork(item)}>
        {isCustomNetwork ? (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              overflow: 'hidden',
              backgroundColor: theme.colors.$surfaceSecondary,
              borderWidth: 1,
              borderColor: theme.colors.$borderPrimary,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Icons.Custom.Category
              width={20}
              height={20}
              color={theme.colors.$textSecondary}
            />
          </View>
        ) : (
          <NetworkLogoWithChain
            network={item}
            networkSize={36}
            showChainLogo
            outerBorderColor={theme.colors.$surfacePrimary}
          />
        )}
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

  const goToNetwork = useCallback(
    (item: Network) => {
      navigate({
        pathname: '/accountSettings/manageNetworks/addCustomNetwork',
        params: {
          chainId: item.chainId.toString()
        }
      })
    },
    [navigate]
  )
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
