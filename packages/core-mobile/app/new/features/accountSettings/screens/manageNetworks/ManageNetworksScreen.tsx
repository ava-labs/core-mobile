import { ChainId, Network } from '@avalabs/core-chains-sdk'
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
import { alwaysEnabledChainIds, defaultEnabledL2ChainIds } from 'store/network'
import { isPChain, isXChain, isXPChain } from 'utils/network/isAvalancheNetwork'

enum SectionTypeEnum {
  HEADER = 'header',
  ITEM = 'item'
}

type SectionItemType = {
  type: SectionTypeEnum
  key: string
  title?: string
  data?: Network
}

export const ManageNetworksScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { navigate } = useRouter()
  const { networks, enabledNetworks, customNetworks, toggleNetwork } =
    useNetworks()

  const title = 'Networks'
  const [searchText, setSearchText] = useState('')

  const filterNetworks = useCallback(
    (items: Network[]) => {
      const enabled = items.filter(network =>
        enabledNetworks.some(
          enabledNetwork => enabledNetwork.chainId === network.chainId
        )
      )

      const disabled = items.filter(
        network =>
          !enabledNetworks.some(
            enabledNetwork => enabledNetwork.chainId === network.chainId
          )
      )

      if (searchText.length) {
        return [...enabled, ...disabled].filter(
          network =>
            network.chainName
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            network.chainId.toString().includes(searchText)
        )
      }

      return [...enabled, ...disabled]
    },
    [enabledNetworks, searchText]
  )

  const data = useMemo(() => {
    const primaryNetworks = Object.values(networks)
      .filter(network => {
        if (ChainId.AVALANCHE_MAINNET_ID === network.chainId) {
          network.chainName = 'Avalanche C-Chain'
        }

        if (ChainId.AVALANCHE_TESTNET_ID === network.chainId) {
          network.chainName = 'Avalanche C-Chain Testnet'
        }

        return (
          alwaysEnabledChainIds.includes(network.chainId) ||
          defaultEnabledL2ChainIds.includes(network.chainId) ||
          isXChain(network.chainId)
        )
      })
      .sort(sortPrimaryNetworks)
    const custom = filterNetworks(Object.values(customNetworks))
    const layer1Networks = filterNetworks(
      Object.values(networks).filter(
        network =>
          !alwaysEnabledChainIds.includes(network.chainId) &&
          !custom.some(item => item.chainId === network.chainId) &&
          !defaultEnabledL2ChainIds.includes(network.chainId) &&
          !isXChain(network.chainId)
      )
    )

    const sectionedNetworks = [
      {
        key: 'primary-networks',
        title: '',
        data: filterNetworks(primaryNetworks)
      }
    ]

    if (custom.length) {
      sectionedNetworks.push({
        key: 'custom-networks',
        title: 'Custom networks',
        data: custom
      })
    }

    if (layer1Networks.length) {
      sectionedNetworks.push({
        title: 'Avalanche L1s',
        key: 'avalanche-l1s',
        data: filterNetworks(layer1Networks)
      })
    }

    return sectionedNetworks.flatMap(section => [
      { type: SectionTypeEnum.HEADER, title: section.title, key: section.key },
      ...section.data.map(item => ({
        type: SectionTypeEnum.ITEM,
        data: item,
        key: item.chainId.toString()
      }))
    ])
  }, [customNetworks, filterNetworks, networks])

  const renderSectionHeader = useCallback((sectionItem: SectionItemType) => {
    if (!sectionItem.title) {
      return <></>
    }

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
        <Text variant="heading3">{sectionItem.title}</Text>
      </View>
    )
  }, [])

  const renderNetwork: ListRenderItem<SectionItemType> = ({
    item: sectionItem,
    index
  }): JSX.Element => {
    if (sectionItem.type === SectionTypeEnum.HEADER) {
      return renderSectionHeader(sectionItem)
    }

    const item = sectionItem.data
    if (!item) {
      return <></>
    }

    const isEnabled = enabledNetworks.some(
      network => network.chainId === item.chainId
    )

    const isNextSection = data[index + 1]?.type === SectionTypeEnum.HEADER
    const isLast = isNextSection || index === data.length - 1
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
          <Text testID={`network_list__${item.chainName}`} style={{ flex: 1 }}>
            {item.chainName}
          </Text>
          {!alwaysEnabledChainIds.includes(item.chainId) && (
            <Toggle
              testID={
                isEnabled
                  ? `network_toggle_enabled__${item.chainName}`
                  : `network_toggle_disabled__${item.chainName}`
              }
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
    return <SearchBar onTextChanged={setSearchText} searchText={searchText} />
  }, [setSearchText, searchText])

  const renderHeaderRight = useCallback(() => {
    return (
      <NavigationBarButton
        testID="add_network_btn"
        isModal
        onPress={goToAddCustomNetwork}>
        <Icons.Content.Add color={theme.colors.$textPrimary} />
      </NavigationBarButton>
    )
  }, [goToAddCustomNetwork, theme.colors.$textPrimary])

  return (
    <ListScreen
      title={title}
      data={data}
      isModal
      hasParent
      keyExtractor={item => item.key}
      renderItem={renderNetwork}
      renderHeaderRight={renderHeaderRight}
      renderHeader={renderHeader}
    />
  )
}
