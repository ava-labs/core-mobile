import React, {FC, memo, useEffect, useRef} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet, View} from 'react-native';
import PortfolioHeader from 'screens/portfolio/PortfolioHeader';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  TokenWithBalance,
  useAccountsContext,
} from '@avalabs/wallet-react-components';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {PortfolioStackParamList} from 'navigation/wallet/PortfolioScreenStack';
import PortfolioListItem from 'screens/portfolio/components/PortfolioListItem';
import ZeroState from 'components/ZeroState';
import {usePortfolio} from 'screens/portfolio/usePortfolio';
import {useSelectedTokenContext} from 'contexts/SelectedTokenContext';
import {getTokenUID} from 'utils/TokenTools';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import WatchlistCarrousel from 'screens/watchlist/components/WatchlistCarrousel';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import TabViewAva from 'components/TabViewAva';
import {NftCollection, NFTItemData} from 'screens/nft/NftCollection';
import NftListView from 'screens/nft/NftListView';
import {useNftLoader} from 'screens/nft/useNftLoader';
import {Covalent} from '@avalabs/covalent-sdk';
import Config from 'react-native-config';

type PortfolioProps = {
  tokenList?: TokenWithBalance[];
  loadZeroBalanceList?: () => void;
  handleRefresh?: () => void;
  hasZeroBalance?: boolean;
  setSelectedToken?: (token: TokenWithBalance) => void;
};

export type PortfolioNavigationProp =
  StackNavigationProp<PortfolioStackParamList>;

// experimenting with container pattern and stable props to try to reduce re-renders
function PortfolioContainer(): JSX.Element {
  const {tokenList, loadZeroBalanceList, loadTokenList} =
    useSearchableTokenList();
  const {balanceTotalInUSD, isWalletReady, isBalanceLoading, isErc20Loading} =
    usePortfolio();
  const {setSelectedToken} = useSelectedTokenContext();

  const hasZeroBalance =
    !balanceTotalInUSD ||
    balanceTotalInUSD === '0' ||
    balanceTotalInUSD === '$0.00';

  function handleRefresh() {
    loadTokenList();
  }

  return (
    <>
      {/*{!isWalletReady || isBalanceLoading || isErc20Loading ? (*/}
      {/*  <Loader />*/}
      {/*) : (*/}
      <PortfolioView
        tokenList={tokenList}
        loadZeroBalanceList={loadZeroBalanceList}
        handleRefresh={handleRefresh}
        hasZeroBalance={hasZeroBalance}
        setSelectedToken={setSelectedToken}
      />
      {/*)}*/}
    </>
  );
}

const PortfolioView: FC<PortfolioProps> = memo(
  ({
    tokenList,
    loadZeroBalanceList,
    handleRefresh,
    hasZeroBalance,
    setSelectedToken,
  }: PortfolioProps) => {
    const listRef = useRef<FlatList>(null);
    const navigation = useNavigation<PortfolioNavigationProp>();
    const rootNavigation =
      useNavigation<StackNavigationProp<RootStackParamList>>();

    useEffect(() => {
      const unsubscribe = navigation.addListener('focus', () => {
        loadZeroBalanceList?.();
      });
      return () => navigation.removeListener('focus', unsubscribe);
    }, [navigation]);

    function selectToken(token: TokenWithBalance) {
      setSelectedToken?.(token);
      rootNavigation.navigate(AppNavigation.Wallet.OwnedTokenDetail, {
        tokenId: getTokenUID(token),
      });
    }

    function manageTokens() {
      navigation.navigate(AppNavigation.Wallet.TokenManagement);
    }

    function viewAllWatchlist() {
      navigation.navigate(AppNavigation.Tabs.Watchlist);
    }

    const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
      const token = item.item;
      return (
        <PortfolioListItem
          tokenName={token.name}
          tokenPrice={token.balanceDisplayValue ?? '0'}
          tokenPriceUsd={token.balanceUsdDisplayValue}
          image={token?.logoURI}
          symbol={token.symbol}
          onPress={() => selectToken(token)}
        />
      );
    };

    return (
      <SafeAreaProvider style={styles.flex}>
        <PortfolioHeader />
        {/*{!tokenList ? (*/}
        {/*  <Loader transparent />*/}
        {/*) : (*/}
        <TabViewAva renderCustomLabel={renderCustomLabel}>
          <View title={'Tokens'}>
            <FlatList
              ref={listRef}
              contentContainerStyle={{paddingHorizontal: 16}}
              style={[tokenList?.length === 1 && {flex: 0}]}
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
                      justifyContent: 'space-between',
                    }}>
                    <AvaText.Heading3 textStyle={{marginVertical: 16}}>
                      Favorites
                    </AvaText.Heading3>
                    <View style={{paddingRight: -10}}>
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
                      justifyContent: 'space-between',
                    }}>
                    <AvaText.Heading3 textStyle={{marginVertical: 16}}>
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

          <NftListViewScreen title={'Collectibles'} />
        </TabViewAva>
      </SafeAreaProvider>
    );
  },
);

const AvalancheChainId = 1;

const NftListViewScreen = () => {
  const {navigate} = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {parseNftCollections} = useNftLoader();
  const {activeAccount} = useAccountsContext();

  useEffect(() => {
    const chainID = AvalancheChainId;
    const covalent = new Covalent(chainID, Config.COVALENT_API_KEY);
    const addressC = __DEV__
      ? '0x470820fbbfca29de49c4a474d12af264856d2028' //address with lots of demo NFTs
      : activeAccount?.wallet.getAddressC();
    console.log('chainID', chainID);
    console.log('address C', addressC);
    if (addressC) {
      covalent
        .getAddressBalancesV2(addressC, true)
        .then(value => {
          parseNftCollections(value.data.items as unknown as NftCollection[]);
        })
        .catch(reason => console.error(reason));
    }
  }, []);

  const openNftDetails = (item: NFTItemData) => {
    navigate(AppNavigation.Wallet.NFTDetails, {nft: item});
  };
  const openNftManage = () => {
    navigate(AppNavigation.Wallet.NFTManage);
  };
  return (
    <NftListView
      onItemSelected={openNftDetails}
      onManagePressed={openNftManage}
    />
  );
};

const renderCustomLabel = (title: string) => {
  return <AvaText.Heading3>{title}</AvaText.Heading3>;
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tokenList: {
    marginTop: 12,
  },
});

export default PortfolioContainer;
