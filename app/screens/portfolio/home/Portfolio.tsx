import React from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
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
import { usePosthogContext } from 'contexts/PosthogContext'
import { RefreshControl } from 'components/RefreshControl'
import { NFTItemData } from 'store/nft'
import { PortfolioScreenProps } from 'navigation/types'
import InactiveNetworkCard from './components/Cards/InactiveNetworkCard'
import { PortfolioTokensLoader } from './components/Loaders/PortfolioTokensLoader'
import PortfolioHeader from './components/PortfolioHeader'
import { TokensTabHeader } from './components/TokensTabHeader'

const Portfolio = () => {
  const collectiblesDisabled = useIsUIDisabled(UI.Collectibles)
  const { capture } = usePosthogContext()

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
        renderCustomLabel={renderCustomLabel}
        shouldDisableTouch={collectiblesDisabled}>
        <TabViewAva.Item title={'Tokens'}>
          <TokensTab />
        </TabViewAva.Item>
        <TabViewAva.Item title={'Collectibles'}>
          <NftTab />
        </TabViewAva.Item>
      </TabViewAva>
    </>
  )
}

const TokensTab = () => {
  const { isLoading, isRefetching, refetch } = useSearchableTokenList()
  const inactiveNetworks = useSelector(selectInactiveNetworks)

  const renderInactiveNetwork = (item: ListRenderItemInfo<Network>) => {
    return <InactiveNetworkCard network={item.item} />
  }

  const Separator = () => <Space y={16} />

  if (isLoading) return <PortfolioTokensLoader />

  return (
    <FlatList
      columnWrapperStyle={{
        justifyContent: 'space-between'
      }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingBottom: 100
      }}
      numColumns={2}
      data={inactiveNetworks}
      renderItem={renderInactiveNetwork}
      keyExtractor={item => item.chainId.toString()}
      ItemSeparatorComponent={Separator}
      scrollEventThrottle={16}
      ListHeaderComponent={<TokensTabHeader />}
      refreshControl={
        <RefreshControl onRefresh={refetch} refreshing={isRefetching} />
      }
    />
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

const renderCustomLabel = (title: string) => {
  return <AvaText.Heading3>{title}</AvaText.Heading3>
}

export default Portfolio
