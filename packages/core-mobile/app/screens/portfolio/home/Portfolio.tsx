import React from 'react'
import { ListRenderItemInfo, Platform } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import AppNavigation from 'navigation/AppNavigation'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import NftListView from 'screens/nft/NftListView'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { useDispatch, useSelector } from 'react-redux'
import { Network } from '@avalabs/chains-sdk'
import { Space } from 'components/Space'
import { RefreshControl } from 'components/RefreshControl'
import { NFTItem } from 'store/nft'
import { PortfolioScreenProps } from 'navigation/types'
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import { TokensTabHeader } from 'screens/portfolio/home/components/TokensTabHeader'
import { PortfolioTabs } from 'consts/portfolio'
import { selectIsDeFiBlocked } from 'store/posthog'
import { DeFiProtocolList } from 'screens/defi/DeFiProtocolList'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { fetchWatchlist } from 'store/watchlist'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectIsLoadingBalances } from 'store/balance'
import InactiveNetworkCard from './components/Cards/InactiveNetworkCard'
import PortfolioHeader from './components/PortfolioHeader'
import { PortfolioInactiveNetworksLoader } from './components/Loaders/PortfolioInactiveNetworksLoader'

type PortfolioNavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>

const Portfolio = (): JSX.Element => {
  const { params } = useRoute<PortfolioNavigationProp['route']>()
  const { setParams } = useNavigation<PortfolioNavigationProp['navigation']>()

  const collectiblesDisabled = useIsUIDisabled(UI.Collectibles)
  const defiBlocked = useSelector(selectIsDeFiBlocked)

  function captureAnalyticsEvents(tabIndex: number): void {
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
  }

  return (
    <>
      <PortfolioHeader />
      <TabViewAva
        currentTabIndex={params?.tabIndex}
        onTabIndexChange={tabIndex => {
          setParams({ tabIndex })
          captureAnalyticsEvents(tabIndex)
        }}
        hideSingleTab={false}
        renderCustomLabel={renderCustomLabel}>
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
  const { inactiveNetworks } = useNetworks()
  const { isRefetching, refetch } = useSearchableTokenList()
  const dispatch = useDispatch()
  const isLoadingBalances = useSelector(selectIsLoadingBalances)

  // set item to render to the first inactive network as dummy single value array
  // in order to show the loader while the balances are still loading
  // * the loader consist of 4 content reactangle loaders
  const itemsToRender =
    isLoadingBalances && inactiveNetworks.length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        [inactiveNetworks[0]!]
      : inactiveNetworks

  const renderInactiveNetworkLoader = (): React.JSX.Element => {
    return <PortfolioInactiveNetworksLoader />
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
        <InactiveNetworkCard network={item.item} />
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
        columnWrapperStyle={{
          justifyContent: 'space-between'
        }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100
        }}
        numColumns={2}
        data={itemsToRender}
        renderItem={
          isLoadingBalances
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
  const { navigate } = useNavigation<PortfolioNavigationProp['navigation']>()

  const openNftDetails = (item: NFTItem): void => {
    AnalyticsService.capture('CollectibleItemClicked', {
      chainId: item.chainId
    })
    navigate(AppNavigation.Wallet.NFTDetails, {
      screen: AppNavigation.Nft.Details,
      params: { nftItem: item }
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

const renderCustomLabel = (
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
