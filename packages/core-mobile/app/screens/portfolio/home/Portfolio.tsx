import React, { useCallback, useEffect, useState } from 'react'
import { ListRenderItemInfo, Platform } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import AppNavigation from 'navigation/AppNavigation'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import NftListView from 'screens/nft/NftListView'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { useDispatch, useSelector } from 'react-redux'
import { Network } from '@avalabs/core-chains-sdk'
import { Space } from 'components/Space'
import { RefreshControl } from 'components/RefreshControl'
import { PortfolioScreenProps } from 'navigation/types'
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import { TokensTabHeader } from 'screens/portfolio/home/components/TokensTabHeader'
import { PortfolioTabs } from 'consts/portfolio'
import { selectIsDeFiBlocked } from 'store/posthog'
import { DeFiProtocolList } from 'screens/defi/DeFiProtocolList'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { fetchWatchlist } from 'store/watchlist'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectIsBalanceLoadedForNetworks } from 'store/balance/slice'
import { selectActiveChainId, setActive } from 'store/network'
import { promptEnableNotifications } from 'store/notifications'
import { NftItem } from 'services/nft/types'
import InactiveNetworkCard from './components/Cards/InactiveNetworkCard'
import PortfolioHeader from './components/PortfolioHeader'
import { PortfolioInactiveNetworksLoader } from './components/Loaders/PortfolioInactiveNetworksLoader'

type PortfolioNavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>

const Portfolio = (): JSX.Element => {
  const { params } = useRoute<PortfolioNavigationProp['route']>()
  const dispatch = useDispatch()
  const collectiblesDisabled = useIsUIDisabled(UI.Collectibles)
  const defiBlocked = useSelector(selectIsDeFiBlocked)

  useEffect(() => {
    dispatch(promptEnableNotifications)
  }, [dispatch])

  const captureAnalyticsEvents = useCallback((tabIndex: number): void => {
    switch (tabIndex) {
      case PortfolioTabs.Tokens:
        AnalyticsService.capture('PortfolioAssetsClicked')
        break
      case PortfolioTabs.NFT:
        AnalyticsService.capture('PortfolioCollectiblesClicked')
        break
      case PortfolioTabs.DeFi:
        AnalyticsService.capture('PortfolioDeFiClicked')
    }
  }, [])

  return (
    <>
      <PortfolioHeader />
      <TabViewAva
        currentTabIndex={params?.tabIndex}
        onTabIndexChange={captureAnalyticsEvents}
        hideSingleTab={false}
        renderLabel={renderLabel}>
        <TabViewAva.Item title={'Assets'}>
          <TokensTab />
        </TabViewAva.Item>
        {!collectiblesDisabled && (
          <TabViewAva.Item title={'Collectibles'}>
            <NftTab />
          </TabViewAva.Item>
        )}
        {!defiBlocked && (
          <TabViewAva.Item title={'DeFi'}>
            <DeFiTab />
          </TabViewAva.Item>
        )}
      </TabViewAva>
    </>
  )
}

const Separator = (): JSX.Element => <Space y={16} />

const TokensTab = (): JSX.Element => {
  const { navigate } = useNavigation<PortfolioNavigationProp['navigation']>()
  const { inactiveNetworks } = useNetworks()
  const { isRefetching, refetch } = useSearchableTokenList()
  const dispatch = useDispatch()
  const [
    inactiveNetworkCardContentHeights,
    setInactiveNetworkCardContentHeights
  ] = useState<Record<number, number>>({})
  const numberOfColumns = 2

  const isBalanceLoadedForInactiveNetworks = useSelector(
    selectIsBalanceLoadedForNetworks(
      inactiveNetworks.map(network => network.chainId)
    )
  )

  // set item to render to the first inactive network as dummy single value array
  // in order to show the loader while the balances are still loading
  // * the loader consist of 4 content reactangle loaders
  const itemsToRender =
    !isBalanceLoadedForInactiveNetworks && inactiveNetworks.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        [inactiveNetworks[0]!]
      : inactiveNetworks

  const renderInactiveNetworkLoader = (): React.JSX.Element => {
    return <PortfolioInactiveNetworksLoader />
  }

  const getInactiveNetworkCardHeight = (index: number): number | undefined => {
    const row = Math.floor(index / numberOfColumns)
    const startIndex = row * numberOfColumns
    const endIndex = startIndex + numberOfColumns

    const contentHeightsInRow = []
    for (let i = startIndex; i < endIndex; i++) {
      const height = inactiveNetworkCardContentHeights[i]
      if (height !== undefined) {
        contentHeightsInRow.push(height)
      }
    }

    return contentHeightsInRow.length > 0
      ? Math.max(...contentHeightsInRow)
      : undefined
  }

  const handlePressInactiveNetwork = (network: Network): void => {
    AnalyticsService.capture('PortfolioSecondaryNetworkClicked', {
      chainId: network.chainId
    })
    dispatch(setActive(network.chainId))
    setTimeout(
      () => {
        navigate(AppNavigation.Portfolio.NetworkTokens)
      },
      Platform.OS === 'ios' ? 700 : 0
    )
  }

  const renderInactiveNetwork = (
    item: ListRenderItemInfo<Network>
  ): JSX.Element => {
    return (
      <Animated.View
        sharedTransitionTag={
          Platform.OS === 'ios'
            ? 'inactive-network-card' + item.index
            : undefined
        }
        exiting={FadeOutUp.duration(300)}
        entering={FadeInDown.delay(300).duration(300)}>
        <InactiveNetworkCard
          network={item.item}
          height={getInactiveNetworkCardHeight(item.index)}
          onPress={handlePressInactiveNetwork}
          onContentLayout={({ nativeEvent }) => {
            setInactiveNetworkCardContentHeights(prev => ({
              ...prev,
              [item.index]: nativeEvent.layout.height
            }))
          }}
        />
      </Animated.View>
    )
  }

  const refresh = (): void => {
    refetch()
    dispatch(fetchWatchlist)
  }

  return (
    <>
      <Animated.FlatList
        testID={'tokens_tab_list_view'}
        columnWrapperStyle={{
          justifyContent: 'space-between'
        }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100
        }}
        numColumns={numberOfColumns}
        data={itemsToRender}
        renderItem={
          !isBalanceLoadedForInactiveNetworks
            ? renderInactiveNetworkLoader
            : renderInactiveNetwork
        }
        keyExtractor={item => item.chainId.toString()}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={<TokensTabHeader />}
        refreshControl={
          <RefreshControl onRefresh={refresh} refreshing={isRefetching} />
        }
      />
    </>
  )
}

const NftTab = (): JSX.Element => {
  const chainId = useSelector(selectActiveChainId)
  const { navigate } = useNavigation<PortfolioNavigationProp['navigation']>()

  const openNftDetails = (item: NftItem): void => {
    AnalyticsService.capture('CollectibleItemClicked', {
      chainId: chainId.toString()
    })
    navigate(AppNavigation.Wallet.NFTDetails, {
      screen: AppNavigation.Nft.Details,
      params: { localId: item.localId }
    })
  }
  const openNftManage = (): void => {
    navigate(AppNavigation.Wallet.NFTManage)
  }
  return (
    <NftListView
      onItemSelected={openNftDetails}
      onManagePressed={openNftManage}
    />
  )
}

const DeFiTab = (): JSX.Element => {
  return <DeFiProtocolList />
}

const renderLabel = (
  title: string,
  selected: boolean,
  color: string
): JSX.Element => {
  return (
    <AvaText.Heading3 textStyle={{ color }} ellipsizeMode="tail">
      {title}
    </AvaText.Heading3>
  )
}

export default Portfolio
