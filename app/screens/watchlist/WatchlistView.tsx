import React, {FC, useEffect, useState} from 'react';
import {FlatList, ListRenderItemInfo, StyleSheet, View} from 'react-native';
import Loader from 'components/Loader';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {getTokenUID} from 'utils/TokenTools';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
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

interface Props {
  showFavorites?: boolean;
  title?: string;
  searchText?: string;
}

const filterByOptions = ['Price', 'Market Cap', 'Volume', 'Gainers', 'Losers'];
const filterTimeOptions = ['1H', '1D', '1W', '1Y'];

const WatchlistView: FC<Props> = ({showFavorites, searchText}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {watchlistFavorites} =
    useApplicationContext().repo.watchlistFavoritesRepo;
  const {filteredTokenList, setSearchText, loadTokenList} =
    useSearchableTokenList(false);

  const data = showFavorites
    ? filteredTokenList?.filter(token =>
        watchlistFavorites.includes(getTokenUID(token)),
      )
    : filteredTokenList;

  const [filterBy, setFilterBy] = useState(filterByOptions[0]);
  const [filterTime, setFilterTime] = useState(filterTimeOptions[0]);

  useEffect(() => {
    if (!showFavorites) {
      setSearchText(searchText ?? '');
    }
  }, [searchText]);

  function handleRefresh() {
    loadTokenList();
  }

  const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
    const token = item.item;
    const logoUri = token?.logoURI ?? undefined;

    return (
      <WatchListItem
        tokenName={token.name}
        tokenPrice={token?.balanceDisplayValue ?? '0'}
        tokenPriceUsd={token?.priceUSD?.toString() ?? '0'}
        symbol={token.symbol}
        image={logoUri}
        rank={!showFavorites ? item.index + 1 : undefined}
        onPress={() =>
          navigation.navigate(AppNavigation.Wallet.TokenDetail, {
            tokenId: getTokenUID(token),
          })
        }
      />
    );
  };

  return (
    <SafeAreaProvider style={styles.container}>
      {!filteredTokenList ? (
        <Loader />
      ) : (
        <>
          <View style={styles.filterContainer}>
            <ListFilter
              title={'Sort by'}
              filterOptions={filterByOptions}
              currentItem={filterBy}
              onItemSelected={setFilterBy}
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
            data={data}
            renderItem={renderItem}
            onRefresh={handleRefresh}
            ItemSeparatorComponent={() => (
              <Separator style={{backgroundColor: '#323232', height: 0.5}} />
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
