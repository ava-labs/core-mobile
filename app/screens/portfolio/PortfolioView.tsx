import React, { FC, memo, useEffect, useRef } from 'react'
import { FlatList, ListRenderItemInfo, StyleSheet, View } from 'react-native'
import PortfolioHeader from 'screens/portfolio/PortfolioHeader'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import {
  TokenWithBalance,
  useAccountsContext,
  useNetworkContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import AppNavigation from 'navigation/AppNavigation'
import PortfolioListItem from 'screens/portfolio/components/PortfolioListItem'
import ZeroState from 'components/ZeroState'
import { usePortfolio } from 'screens/portfolio/usePortfolio'
import { useSelectedTokenContext } from 'contexts/SelectedTokenContext'
import { getTokenUID } from 'utils/TokenTools'
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

type PortfolioProps = {
  tokenList?: TokenWithBalance[]
  loadZeroBalanceList?: () => void
  handleRefresh?: () => void
  hasZeroBalance?: boolean
  setSelectedToken?: (token: TokenWithBalance) => void
}

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioContainer(): JSX.Element {
  const { filteredTokenList, loadZeroBalanceList, loadTokenList } =
    useSearchableTokenList()
  const { balanceTotalInUSD } = usePortfolio()
  const { setSelectedToken } = useSelectedTokenContext()

  const hasZeroBalance =
    !balanceTotalInUSD ||
    balanceTotalInUSD === '0' ||
    balanceTotalInUSD === '$0.00'

  function handleRefresh() {
    loadTokenList()
  }

  return (
    <>
      <PortfolioView
        tokenList={filteredTokenList}
        loadZeroBalanceList={loadZeroBalanceList}
        handleRefresh={handleRefresh}
        hasZeroBalance={hasZeroBalance}
        setSelectedToken={setSelectedToken}
      />
    </>
  )
}

type PortfolioNavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

const PortfolioView: FC<PortfolioProps> = memo(
  ({
    tokenList,
    loadZeroBalanceList,
    handleRefresh,
    setSelectedToken
  }: PortfolioProps) => {
    const listRef = useRef<FlatList>(null)
    const { navigate, addListener, removeListener } =
      useNavigation<PortfolioNavigationProp>()
    const walletState = useWalletStateContext()

    useEffect(() => {
      const unsubscribe = addListener('focus', () => {
        loadZeroBalanceList?.()
      })
      return () => removeListener('focus', unsubscribe)
    }, [addListener, removeListener])

    function selectToken(token: TokenWithBalance) {
      setSelectedToken?.(token)

      navigate(AppNavigation.Wallet.OwnedTokenDetail, {
        tokenId: getTokenUID(token)
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
          showLoading={walletState?.isErc20TokenListLoading ?? false}
          tokenName={token.name}
          tokenPrice={token.balanceDisplayValue ?? '0'}
          tokenPriceUsd={token.balanceUsdDisplayValue}
          image={token?.logoURI}
          symbol={token.symbol}
          onPress={() => selectToken(token)}
        />
      )
    }

    return (
      <SafeAreaProvider style={styles.flex}>
        <PortfolioHeader />
        <TabViewAva renderCustomLabel={renderCustomLabel}>
          <TabViewAva.Item title={'Tokens'}>
            <View>
              <FlatList
                ref={listRef}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                style={[tokenList?.length === 1 && { flex: 0 }]}
                data={tokenList}
                renderItem={renderItem}
                keyExtractor={(item: TokenWithBalance) => getTokenUID(item)}
                onRefresh={handleRefresh}
                refreshing={false}
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
                        onPress={manageTokens}>
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
  const { activeAccount } = useAccountsContext()
  const { network } = useNetworkContext()!

  useEffect(() => {
    const isDev = __DEV__
    const chainID = isDev ? Ethereum : Number(network?.chainId ?? 0)
    const covalent = new Covalent(chainID, Config.COVALENT_API_KEY)
    const addressC = isDev ? 'demo.eth' : activeAccount?.wallet.getAddressC()
    if (addressC) {
      covalent
        .getAddressBalancesV2(addressC, true)
        .then(value => {
          parseNftCollections(value.data.items as unknown as NftCollection[])
        })
        .catch(reason => console.error(reason))
    }
  }, [network?.chainId, activeAccount?.wallet]) // adding parseNftCollections as dependency starts infinite loop

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
