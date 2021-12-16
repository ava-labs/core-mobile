import React from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import SearchSVG from 'components/svg/SearchSVG';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import {Opacity50} from 'resources/Constants';
import Loader from 'components/Loader';
import ZeroState from 'components/ZeroState';
import PortfolioListItem from 'screens/portfolio/components/PortfolioListItem';
import {Space} from 'components/Space';
import {getTokenUID} from 'utils/UniqueToken';

const DEFAULT_HORIZONTAL_MARGIN = 16;

interface TokenSelectorProps {
  onTokenSelected: (token: TokenWithBalance) => void;
  horizontalMargin?: number;
}

function TokenSelector({
  onTokenSelected,
  horizontalMargin = DEFAULT_HORIZONTAL_MARGIN,
}: TokenSelectorProps) {
  const {filteredTokenList, searchText, setSearchText, loadTokenList} =
    useSearchableTokenList(false);
  const context = useApplicationContext();

  function handleRefresh() {
    loadTokenList();
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
        onPress={() => {
          onTokenSelected(token);
        }}
      />
    );
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  function getNoResultsText() {
    if (
      !filteredTokenList ||
      (filteredTokenList &&
        filteredTokenList?.length === 0 &&
        (!searchText || (searchText && searchText.length === 0)))
    ) {
      return 'You have no tokens to send';
    }
    return undefined;
  }

  return (
    <View style={{flex: 1, marginHorizontal: horizontalMargin}}>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBackground,
            {backgroundColor: context.theme.colorBg3 + Opacity50},
          ]}>
          <SearchSVG color={context.theme.onBgSearch} size={32} hideBorder />
          <TextInput
            style={[styles.searchInput, {color: context.theme.txtOnBgApp}]}
            placeholder="Search"
            placeholderTextColor={context.theme.onBgSearch}
            value={searchText}
            onChangeText={handleSearch}
            underlineColorAndroid="transparent"
            accessible
            clearButtonMode="always"
            autoCapitalize="none"
            numberOfLines={1}
          />
        </View>
      </View>
      <Space y={16} />
      {!filteredTokenList ? (
        <Loader />
      ) : (
        <FlatList
          data={filteredTokenList}
          renderItem={renderItem}
          onRefresh={handleRefresh}
          refreshing={false}
          keyExtractor={(item: TokenWithBalance) => getTokenUID(item)}
          ListEmptyComponent={
            <ZeroState.NoResults message={getNoResultsText()} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
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

export default TokenSelector;
