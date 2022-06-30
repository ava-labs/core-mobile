import React, { useEffect } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import AppNavigation from 'navigation/AppNavigation'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import { NftCollection, NFTItemData } from 'screens/nft/NftCollection'
import NftListView from 'screens/nft/NftListView'
import { useNftLoader } from 'screens/nft/useNftLoader'
import { Covalent } from '@avalabs/covalent-sdk'
import Config from 'react-native-config'
import { PortfolioScreenProps } from 'navigation/types'
import { useIsUIDisabled, UI } from 'hooks/useIsUIDisabled'
import { useSelector } from 'react-redux'
import { selectActiveNetwork, selectInactiveNetworks } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { Network } from '@avalabs/chains-sdk'
import { Space } from 'components/Space'
import InactiveNetworkCard from './components/Cards/InactiveNetworkCard'
import { PortfolioTokensLoader } from './components/Loaders/PortfolioTokensLoader'
import PortfolioHeader from './components/PortfolioHeader'
import { TokensTabHeader } from './components/TokensTabHeader'

type PortfolioNavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const Portfolio = () => {
  const collectiblesDisabled = useIsUIDisabled(UI.Collectibles)

  return (
    <>
      <PortfolioHeader />
      <TabViewAva
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
        paddingHorizontal: 16,
        paddingBottom: 100
      }}
      numColumns={2}
      data={inactiveNetworks}
      renderItem={renderInactiveNetwork}
      keyExtractor={item => item.chainId.toString()}
      ItemSeparatorComponent={Separator}
      onRefresh={refetch}
      refreshing={isRefetching}
      scrollEventThrottle={16}
      ListHeaderComponent={<TokensTabHeader />}
    />
  )
}

const Ethereum = 1

const NftTab = () => {
  const { navigate } = useNavigation<PortfolioNavigationProp>()
  const { parseNftCollections } = useNftLoader()
  const activeAccount = useSelector(selectActiveAccount)
  const network = useSelector(selectActiveNetwork)

  useEffect(() => {
    const isDev = __DEV__
    const chainID = isDev ? Ethereum : Number(network.chainId ?? 0)
    const covalent = new Covalent(chainID, Config.COVALENT_API_KEY)
    const addressC = isDev ? 'demo.eth' : activeAccount?.address
    if (addressC) {
      covalent
        .getAddressBalancesV2(addressC, true)
        .then(value => {
          parseNftCollections(value.data.items as unknown as NftCollection[])
        })
        .catch(reason => console.error(reason))
    }
  }, [activeAccount?.address, network.chainId]) // adding parseNftCollections as dependency starts infinite loop

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
