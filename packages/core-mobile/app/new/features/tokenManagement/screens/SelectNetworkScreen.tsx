import { Network } from '@avalabs/core-chains-sdk'
import {
  Icons,
  Pressable,
  SearchBar,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListScreen } from 'common/components/ListScreen'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { sortPrimaryNetworks } from 'common/utils/sortPrimaryNetworks'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { useCallback, useMemo, useState } from 'react'
import { ListRenderItem } from 'react-native'
import { isPChain, isXChain, isXPChain } from 'utils/network/isAvalancheNetwork'
import { useRouter } from 'expo-router'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { useNetwork } from '../store'

const TITLE = 'Networks'

export const SelectNetworkScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { canGoBack, back } = useRouter()
  const { networks, enabledNetworks, customNetworks } = useNetworks()
  const [searchText, setSearchText] = useState('')
  const [network, setNetwork] = useNetwork()

  const filterBySearchText = useCallback(
    (n: Network) =>
      n.chainName.toLowerCase().includes(searchText.toLowerCase()) ||
      n.chainId.toString().includes(searchText),
    [searchText]
  )

  const availableNetworks = useMemo(() => {
    const enabled = Object.values(networks).filter(n =>
      enabledNetworks.includes(n)
    )

    const filteredEnabled = enabled.filter(
      n =>
        !isPChain(n.chainId) &&
        !isXChain(n.chainId) &&
        !isBitcoinChainId(n.chainId)
    )

    const custom = Object.values(customNetworks).filter(
      n => !enabled.includes(n)
    )
    return [...filteredEnabled, ...custom].sort(sortPrimaryNetworks)
  }, [customNetworks, enabledNetworks, networks])

  const filteredNetworks = useMemo(() => {
    if (searchText.length) {
      return availableNetworks.filter(filterBySearchText)
    }
    return availableNetworks
  }, [availableNetworks, filterBySearchText, searchText.length])

  const handleSelectNetwork = useCallback(
    (n: Network): void => {
      setNetwork(n)
      canGoBack() && back()
    },
    [back, canGoBack, setNetwork]
  )

  const renderNetwork: ListRenderItem<Network> = useCallback(
    ({ item, index }): JSX.Element => {
      const isSelected = network?.chainId === item.chainId
      const isLast = index === filteredNetworks.length - 1
      const isCustomNetwork = Object.values(customNetworks).some(
        n => n.chainId === item.chainId
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
          onPress={() => handleSelectNetwork(item)}>
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
            {isSelected && (
              <Icons.Custom.CheckSmall color={theme.colors.$textPrimary} />
            )}
          </View>
        </Pressable>
      )
    },
    [
      customNetworks,
      filteredNetworks.length,
      handleSelectNetwork,
      network?.chainId,
      theme.colors.$borderPrimary,
      theme.colors.$surfacePrimary,
      theme.colors.$surfaceSecondary,
      theme.colors.$textPrimary,
      theme.colors.$textSecondary
    ]
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

  return (
    <ListScreen
      title={TITLE}
      data={filteredNetworks}
      isModal
      keyExtractor={item => item.chainId.toString()}
      renderItem={renderNetwork}
      renderHeader={renderHeader}
    />
  )
}
