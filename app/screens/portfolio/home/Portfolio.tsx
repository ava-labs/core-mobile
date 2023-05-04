import React from 'react'
import { ListRenderItemInfo, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import AppNavigation from 'navigation/AppNavigation'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import NftListView from 'screens/nft/NftListView'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { useSelector } from 'react-redux'
import { selectInactiveNetworks } from 'store/network'
import { Network } from '@avalabs/chains-sdk'
import { Space } from 'components/Space'
import { RefreshControl } from 'components/RefreshControl'
import { NFTItemData } from 'store/nft'
import { PortfolioScreenProps } from 'navigation/types'
import { usePostCapture } from 'hooks/usePosthogCapture'
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated'
import { TokensTabHeader } from 'screens/portfolio/home/components/TokensTabHeader'
import InactiveNetworkCard from './components/Cards/InactiveNetworkCard'
import { PortfolioTokensLoader } from './components/Loaders/PortfolioTokensLoader'
import PortfolioHeader from './components/PortfolioHeader'

const Portfolio = () => {
  const collectiblesDisabled = useIsUIDisabled(UI.Collectibles)
  const { capture } = usePostCapture()

  function capturePosthogEvents(tabIndex: number) {
    switch (tabIndex) {
      case 0:
        capture('PortfolioAssetsClicked')
        break
      case 1:
        capture('PortfolioCollectiblesClicked')
        break
    }
  }

  return (
    <>
      <PortfolioHeader />
      <TabViewAva
        onTabIndexChange={tabIndex => capturePosthogEvents(tabIndex)}
        renderCustomLabel={renderCustomLabel}>
        <TabViewAva.Item title={'Assets'}>
          <TokensTab />
        </TabViewAva.Item>
        {!collectiblesDisabled && (
          <TabViewAva.Item title={'Collectibles'}>
            <NftTab />
          </TabViewAva.Item>
        )}
      </TabViewAva>
    </>
  )
}

const Separator = () => <Space y={16} />

const TokensTab = () => {
  const { isLoading, isRefetching, refetch } = useSearchableTokenList()
  const inactiveNetworks = useSelector(selectInactiveNetworks)

  const renderInactiveNetwork = (item: ListRenderItemInfo<Network>) => {
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

  if (isLoading) return <PortfolioTokensLoader />

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
        data={inactiveNetworks}
        renderItem={renderInactiveNetwork}
        keyExtractor={item => item.chainId.toString()}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={<TokensTabHeader />}
        refreshControl={
          <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
        }
      />
    </>
  )
}

type PortfolioNavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const NftTab = () => {
  const { navigate } = useNavigation<PortfolioNavigationProp>()

  const openNftDetails = (item: NFTItemData) => {
    navigate(AppNavigation.Wallet.NFTDetails, {
      screen: AppNavigation.Nft.Details,
      params: { nft: item }
    })
  }
  const openNftManage = () => {
    navigate(AppNavigation.Wallet.NFTManage)
  }
  return (
    <NftListView
      onItemSelected={openNftDetails}
      onManagePressed={openNftManage}
    />
  )
}

const renderCustomLabel = (title: string, selected: boolean, color: string) => {
  return <AvaText.Heading3 textStyle={{ color }}>{title}</AvaText.Heading3>
}

export default Portfolio
