import React, { FC, memo, useEffect, useRef } from 'react'
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native'
import PortfolioHeader from 'screens/portfolio/PortfolioHeader'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import AppNavigation from 'navigation/AppNavigation'
import PortfolioListItem from 'screens/portfolio/components/PortfolioListItem'
import ZeroState from 'components/ZeroState'
import { useSelectedTokenContext } from 'contexts/SelectedTokenContext'
import WatchlistCarrousel from 'screens/watchlist/components/WatchlistCarrousel'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import TabViewAva from 'components/TabViewAva'
import { NftCollection, NFTItemData } from 'screens/nft/NftCollection'
import NftListView from 'screens/nft/NftListView'
import { useNftLoader } from 'screens/nft/useNftLoader'
import { Covalent } from '@avalabs/covalent-sdk'
import Config from 'react-native-config'
import { PortfolioScreenProps } from 'navigation/types'
import { useIsUIDisabled, UI } from 'hooks/useIsUIDisabled'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { TokenWithBalance } from 'store/balance'
import { selectActiveAccount } from 'store/account'

type PortfolioProps = {
  isLoading?: boolean
  isRefreshing?: boolean
  tokenList?: TokenWithBalance[]
  handleRefresh?: () => void
  hasZeroBalance?: boolean
  setSelectedToken?: (token: TokenWithBalance) => void
  shouldDisableManage?: boolean
  shouldDisableCollectibles?: boolean
}

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioContainer(): JSX.Element {
  const manageDisabled = useIsUIDisabled(UI.ManageTokens)
  const collectiblesDisabled = useIsUIDisabled(UI.Collectibles)
  const { isLoading, isRefetching, filteredTokenList, refetch } =
    useSearchableTokenList()
  const { setSelectedToken } = useSelectedTokenContext()

  return (
    <PortfolioView
      isLoading={isLoading}
      isRefreshing={isRefetching}
      tokenList={filteredTokenList}
      handleRefresh={refetch}
      setSelectedToken={setSelectedToken}
      shouldDisableManage={manageDisabled}
      shouldDisableCollectibles={collectiblesDisabled}
    />
  )
}

type PortfolioNavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const PortfolioView: FC<PortfolioProps> = memo(
  ({
    tokenList,
    handleRefresh,
    isLoading = false,
    isRefreshing = false,
    setSelectedToken,
    shouldDisableManage = false,
    shouldDisableCollectibles = false
  }) => {
    const listRef = useRef<FlatList>(null)
    const { navigate } = useNavigation<PortfolioNavigationProp>()

    function selectToken(token: TokenWithBalance) {
      setSelectedToken?.(token)

      navigate(AppNavigation.Wallet.OwnedTokenDetail, {
        tokenId: token.id
      })
    }

    function manageTokens() {
      navigate(AppNavigation.Wallet.TokenManagement)
    }

    function viewAllWatchlist() {
      navigate(AppNavigation.Tabs.Watchlist)
    }

    const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
      const token = item.item
      return (
        <PortfolioListItem
          showLoading={isLoading || isRefreshing}
          tokenName={token.name}
          tokenPrice={token.balanceDisplayValue ?? '0'}
          tokenPriceInCurrency={token.balanceCurrencyDisplayValue}
          image={token?.logoUri}
          symbol={token.symbol}
          onPress={() => selectToken(token)}
        />
      )
    }

    return (
      <SafeAreaProvider style={styles.flex}>
        <PortfolioHeader />
        <TabViewAva
          renderCustomLabel={renderCustomLabel}
          shouldDisableTouch={shouldDisableCollectibles}>
          <TabViewAva.Item title={'Tokens'}>
            <View>
              <FlatList
                ref={listRef}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                style={[tokenList?.length === 1 && { flex: 0 }]}
                data={tokenList}
                renderItem={renderItem}
                keyExtractor={(item: TokenWithBalance) => item.id}
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                scrollEventThrottle={16}
                ListHeaderComponent={
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                      <AvaText.Heading3 textStyle={{ marginVertical: 16 }}>
                        Favorites
                      </AvaText.Heading3>
                      <View style={{ paddingRight: -10 }}>
                        <AvaButton.TextMedium
                          textColor={'#0A84FF'}
                          onPress={viewAllWatchlist}>
                          View All
                        </AvaButton.TextMedium>
                      </View>
                    </View>
                    <WatchlistCarrousel />
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                      <AvaText.Heading3 textStyle={{ marginVertical: 16 }}>
                        Tokens
                      </AvaText.Heading3>
                      <AvaButton.TextMedium
                        textColor={'#0A84FF'}
                        onPress={manageTokens}
                        disabled={shouldDisableManage}>
                        Manage
                      </AvaButton.TextMedium>
                    </View>
                  </>
                }
                ListEmptyComponent={<ZeroState.Portfolio />}
              />
            </View>
          </TabViewAva.Item>
          <TabViewAva.Item title={'Collectibles'}>
            <NftListViewScreen />
          </TabViewAva.Item>
        </TabViewAva>
      </SafeAreaProvider>
    )
  }
)

const Ethereum = 1

const NftListViewScreen = () => {
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

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  tokenList: {
    marginTop: 12
  }
})

export default PortfolioContainer
