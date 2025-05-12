import { Network } from '@avalabs/core-chains-sdk'
import {
  Icons,
  Pressable,
  SearchBar,
  Text,
  Toggle,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListScreen } from 'common/components/ListScreen'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { sortPrimaryNetworks } from 'common/utils/sortPrimaryNetworks'
import { useRouter } from 'expo-router'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { useCallback, useMemo, useState } from 'react'
import { ListRenderItem } from 'react-native'
import { alwaysEnabledNetworks } from 'store/network'
import { isPChain, isXChain, isXPChain } from 'utils/network/isAvalancheNetwork'

export const ManageNetworksScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { networks, enabledNetworks, customNetworks, toggleNetwork } =
    useNetworks()
  const [searchText, setSearchText] = useState('')
  const title = 'Networks'
  const { navigate } = useRouter()
  const filterBySearchText = useCallback(
    (network: Network) =>
      network.chainName.toLowerCase().includes(searchText.toLowerCase()) ||
      network.chainId.toString().includes(searchText),
    [searchText]
  )

  const availableNetworks = useMemo(() => {
    const enabled = Object.values(networks).filter(network =>
      enabledNetworks.includes(network)
    )

    const custom = Object.values(customNetworks).filter(
      network => !enabled.includes(network)
    )
    const disabled = Object.values(networks)
      .filter(
        network => !enabled.includes(network) && !custom.includes(network)
      )
      .sort(sortPrimaryNetworks)

    return [...enabled, ...custom, ...disabled].sort(sortPrimaryNetworks)
  }, [customNetworks, enabledNetworks, networks])

  const filteredNetworks = useMemo(() => {
    if (searchText.length) {
      return availableNetworks.filter(filterBySearchText)
    }
    return availableNetworks
  }, [availableNetworks, filterBySearchText, searchText.length])

  const renderNetwork: ListRenderItem<Network> = ({
    item,
    index
  }): JSX.Element => {
    const isEnabled = enabledNetworks.some(
      network => network.chainId === item.chainId
    )
    const isLast = index === filteredNetworks.length - 1
    const isCustomNetwork = Object.values(customNetworks).some(
      network => network.chainId === item.chainId
    )

    const showChainLogo =
      isXPChain(item.chainId) ||
      isPChain(item.chainId) ||
      isXChain(item.chainId)

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
            showChainLogo={showChainLogo}
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
          {!alwaysEnabledNetworks.includes(item.chainId) && (
            <Toggle
              value={isEnabled}
              onValueChange={() => toggleNetwork(item.chainId)}
            />
          )}
        </View>
      </Pressable>
    )
  }

  const goToAddCustomNetwork = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/accountSettings/manageNetworks/addCustomNetwork')
  }, [navigate])

  const goToNetwork = useCallback(
    (item: Network) => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/manageNetworks/addCustomNetwork',
        params: {
          chainId: item.chainId.toString()
        }
      })
    },
    [navigate]
  )

  const renderHeader = useCallback(() => {
    return (
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        testID="network_manager__search_input"
      />
    )
  }, [setSearchText, searchText])

  const renderHeaderRight = useCallback(() => {
    return (
      <NavigationBarButton isModal onPress={goToAddCustomNetwork}>
        <Icons.Content.Add color={theme.colors.$textPrimary} />
      </NavigationBarButton>
    )
  }, [goToAddCustomNetwork, theme.colors.$textPrimary])

  return (
    <ListScreen
      title={title}
      data={filteredNetworks}
      isModal
      hasParent
      keyExtractor={item => item.chainId.toString()}
      renderItem={renderNetwork}
      renderHeaderRight={renderHeaderRight}
      renderHeader={renderHeader}
    />
  )
}
