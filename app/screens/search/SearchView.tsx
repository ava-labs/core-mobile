import React, {useContext} from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import SearchSVG from 'components/svg/SearchSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useNavigation} from '@react-navigation/native';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import AppNavigation from 'navigation/AppNavigation';
import {PortfolioStackParamList} from 'navigation/PortfolioStackScreen';
import {StackNavigationProp} from '@react-navigation/stack';
import SearchListItem from 'screens/search/SearchListItem';
import AvaText from 'components/AvaText';
import AddSVG from 'components/svg/AddSVG';
import AvaListItem from 'components/AvaListItem';
import CarrotSVG from 'components/svg/CarrotSVG';

export type SearchRouteProp = StackNavigationProp<
  PortfolioStackParamList,
  'SearchScreen'
>;

function SearchView() {
  const {
    filteredTokenList,
    searchText,
    setSearchText,
    setShowZeroBalanceList,
    showZeroBalanceList,
  } = useSearchableTokenList(false);
  const context = useContext(ApplicationContext);
  const navigation = useNavigation<SearchRouteProp>();

  const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
    const token = item.item;
    const logoUri = token?.logoURI ?? undefined;
    const balance = !token.balance.isZero()
      ? `${token.balanceDisplayValue} ${token.symbol}`
      : undefined;

    return (
      <SearchListItem
        balance={balance}
        name={token.name}
        image={logoUri}
        isShowingZeroBalanceForToken={showZeroBalanceList[token.name]}
        onSwitchChanged={value => {
          showZeroBalanceList[token.name] = value;
          setShowZeroBalanceList({...showZeroBalanceList});
        }}
      />
    );
  };

  const emptyView = (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        marginTop: 32,
      }}>
      <AvaLogoSVG />
      <Text style={{fontSize: 24, paddingTop: 32, textAlign: 'center'}}>
        There are no results. Please try another search
      </Text>
    </View>
  );

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  return (
    <View style={{flex: 1, backgroundColor: context.theme.background}}>
      <AvaText.Body1 textStyle={{alignSelf: 'center', paddingTop: 8}}>
        Add or remove tokens without balance
      </AvaText.Body1>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBackground,
            {backgroundColor: context.theme.bgSearch},
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
      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: context.theme.colorStroke,
        }}>
        <AvaListItem.Base
          title={'Add custom token'}
          leftComponent={
            <AddSVG color={context.theme.colorPrimary1} hideCircle size={24} />
          }
          rightComponent={<CarrotSVG />}
          onPress={() =>
            navigation.navigate(AppNavigation.Wallet.AddCustomToken)
          }
        />
      </View>
      <FlatList
        data={filteredTokenList}
        renderItem={renderItem}
        keyExtractor={(item: TokenWithBalance) => item.symbol}
        ListEmptyComponent={emptyView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
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

export default SearchView;
