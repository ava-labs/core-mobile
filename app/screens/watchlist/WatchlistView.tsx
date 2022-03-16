import React, {FC, useEffect, useMemo, useState} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet, View} from 'react-native';
import Loader from 'components/Loader';
import {
  ERC20WithBalance,
  TokenWithBalance,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import {getTokenUID} from 'utils/TokenTools';
import WatchListItem from 'screens/watchlist/components/WatchListItem';
import ListFilter from 'components/ListFilter';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import Separator from 'components/Separator';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ZeroState from 'components/ZeroState';
import {
  SimplePriceInCurrency,
  simpleTokenPrice,
  VsCurrencyType,
} from '@avalabs/coingecko-sdk';
import {largeCurrencyFormatter} from 'utils/Utils';

interface Props {
  showFavorites?: boolean;
  title?: string;
  searchText?: string;
}

export enum WatchlistFilter {
  PRICE = 'Price',
  MARKET_CAP = 'Market Cap',
  VOLUME = 'Volume',
  GAINERS = 'Gainers',
  LOSERS = 'Losers',
}

export const CG_AVAX_TOKEN_ID =
  'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z';

const filterTimeOptions = ['1D', '1W', '1Y'];

type CombinedTokenType = ERC20WithBalance & SimplePriceInCurrency;

const WatchlistView: FC<Props> = ({showFavorites, searchText}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {selectedCurrency, currencyFormatter} = useApplicationContext().appHook;
  const {watchlistFavorites} =
    useApplicationContext().repo.watchlistFavoritesRepo;
  // const {filteredTokenList, setSearchText, loadTokenList} =
  //   useSearchableTokenList(false);
  const {erc20Tokens, avaxToken} = useWalletStateContext();
  const [combinedData, setCombinedData] = useState<CombinedTokenType[]>([]);
  const [filterBy, setFilterBy] = useState(WatchlistFilter.PRICE);
  const [filterTime, setFilterTime] = useState(filterTimeOptions[0]);
  const tokenAddresses = [
    CG_AVAX_TOKEN_ID,
    ...(erc20Tokens?.map((t: ERC20WithBalance) => t.address) ?? []),
  ];
  const allTokens = [{...avaxToken, address: CG_AVAX_TOKEN_ID}, ...erc20Tokens];

  useEffect(() => {
    if (combinedData.length === 0) {
      refreshPrices();
    }
  }, [allTokens]);

  const sortedData = useMemo(() => {
    // get favorite list or regular list
    const listData = showFavorites
      ? combinedData.filter(tk => watchlistFavorites.includes(tk.address))
      : combinedData;

    // sort data by filter option
    return listData.sort((a, b) => {
      if (filterBy === WatchlistFilter.PRICE) {
        return (b.price ?? 0) - (a.price ?? 0);
      } else if (filterBy === WatchlistFilter.MARKET_CAP) {
        return (b.marketCap ?? 0) - (a.marketCap ?? 0);
      } else {
        return (b.vol24 ?? 0) - (a.vol24 ?? 0);
      }
    });
  }, [combinedData, filterBy]);

  const refreshPrices = async () => {
    if (allTokens && allTokens.length > 0) {
      const rawData = await simpleTokenPrice({
        tokenAddresses,
        currencies: ['usd'] as VsCurrencyType[],
        marketCap: true,
        vol24: true,
        change24: true,
      });
      const mappedData = allTokens?.map(t => {
        const address =
          t.address === CG_AVAX_TOKEN_ID
            ? CG_AVAX_TOKEN_ID
            : t.address.toLowerCase();
        return {
          ...t,
          ...rawData?.[address]?.usd,
        } as CombinedTokenType;
      });
      setCombinedData(mappedData);
    }
  };

  useEffect(() => {
    if (!showFavorites) {
      // setSearchText(searchText ?? '');
    }
  }, [searchText]);

  function handleRefresh() {
    refreshPrices();
  }

  const tokens = useMemo(() => {
    return searchText && searchText.length > 0
      ? sortedData?.filter(
          i =>
            i.name?.toLowerCase().includes(searchText.toLowerCase()) ||
            i.symbol?.toLowerCase().includes(searchText.toLowerCase()),
        )
      : sortedData;
  }, [searchText, sortedData]);

  const renderItem = (item: ListRenderItemInfo<CombinedTokenType>) => {
    const token = item.item;
    const logoUri = token?.logoURI ?? undefined;

    if (token.name === 'TEDDY') {
      console.log('teddy');
    }

    function getDisplayValue() {
      if (filterBy === WatchlistFilter.PRICE) {
        return (token?.price ?? 0) === 0
          ? ' -'
          : token.price > 0 && token.price < 0.1
          ? `$${token.price.toFixed(6)}`
          : currencyFormatter(token.price);
      } else if (filterBy === WatchlistFilter.MARKET_CAP) {
        return (token?.marketCap ?? 0) === 0
          ? ' -'
          : `$${largeCurrencyFormatter(token?.marketCap ?? 0, 3)}`;
      } else if (filterBy === WatchlistFilter.VOLUME) {
        return (token?.vol24 ?? 0) === 0
          ? ' -'
          : `$${largeCurrencyFormatter(token?.vol24 ?? 0, 1)}`;
      }
    }

    return (
      <WatchListItem
        tokenName={token.name}
        tokenAddress={token.address}
        value={getDisplayValue()}
        symbol={token.symbol}
        image={logoUri}
        filterBy={filterBy}
        // rank={!showFavorites ? item.index + 1 : undefined}
        onPress={() =>
          navigation.navigate(AppNavigation.Wallet.TokenDetail, {
            address: token.address,
          })
        }
      />
    );
  };

  return (
    <SafeAreaProvider style={styles.container}>
      {!sortedData ? (
        <Loader />
      ) : (
        <>
          <View style={styles.filterContainer}>
            <ListFilter
              title={'Sort by'}
              filterOptions={[
                WatchlistFilter.PRICE,
                WatchlistFilter.MARKET_CAP,
                WatchlistFilter.VOLUME,
                WatchlistFilter.GAINERS,
                WatchlistFilter.LOSERS,
              ]}
              currentItem={filterBy}
              onItemSelected={filter => setFilterBy(filter as WatchlistFilter)}
              style={{paddingLeft: 25}}
            />
            <ListFilter
              filterOptions={filterTimeOptions}
              currentItem={filterTime}
              onItemSelected={setFilterTime}
              minWidth={50}
              style={{paddingRight: 30}}
            />
          </View>
          <FlatList
            data={tokens}
            renderItem={renderItem}
            onRefresh={handleRefresh}
            ItemSeparatorComponent={() => (
              <Separator
                style={{backgroundColor: '#323232', height: 0.5}}
                inset={8}
              />
            )}
            ListEmptyComponent={<ZeroState.NoResultsTextual />}
            refreshing={false}
            keyExtractor={(item: TokenWithBalance) => getTokenUID(item)}
          />
        </>
      )}
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchBackground: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'center',
    paddingStart: 12,
  },
  searchInput: {
    paddingLeft: 4,
    height: 40,
    flex: 1,
    marginRight: 24,
    fontSize: 16,
  },
});

export default WatchlistView;
