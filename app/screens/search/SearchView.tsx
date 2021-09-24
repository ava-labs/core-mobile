import React, {useContext, useState} from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import SearchSVG from 'components/svg/SearchSVG';
import ClearSVG from 'components/svg/ClearSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {useNavigation} from '@react-navigation/native';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import AvaListItem from 'components/AvaListItem';
import {ERC20} from '@avalabs/wallet-react-components';
import {AvaxToken} from 'dto/AvaxToken';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import AppNavigation from 'navigation/AppNavigation';
import {PortfolioStackParamList} from 'navigation/PortfolioStackScreen';
import {StackNavigationProp} from '@react-navigation/stack';

export type SearchRouteProp = StackNavigationProp<
  PortfolioStackParamList,
  'SearchScreen'
>;

function SearchView() {
  const {filteredTokenList, searchText, setSearchText} =
    useSearchableTokenList();
  // back press hides flatlist to help minimize artifacts during fade out transition
  const [backPressed, setBackPressed] = useState(false);
  const context = useContext(ApplicationContext);
  const navigation = useNavigation<SearchRouteProp>();

  function onCancel() {
    setBackPressed(true);
    setTimeout(() => navigation.goBack(), 0);
  }

  function showBottomSheet(token: ERC20 | AvaxToken) {
    navigation.navigate(AppNavigation.Modal.SendReceiveBottomSheet, {token});
  }

  const renderItem = (item: ListRenderItemInfo<any>) => {
    const token = item.item as ERC20 | AvaxToken;
    const logoUri = (token as ERC20)?.logoURI ?? undefined;
    return (
      <AvaListItem.Token
        tokenName={token.name}
        tokenPrice={token.balanceParsed}
        image={logoUri}
        symbol={token.symbol}
        onPress={() => showBottomSheet(token)}
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
    <View style={{flex: 1, backgroundColor: context.theme.bgApp}}>
      <View
        // while we wait for the proper background from UX
        style={{
          backgroundColor: context.theme.bgApp,
        }}>
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
          <TouchableOpacity style={{paddingLeft: 16}} onPress={onCancel}>
            <ClearSVG
              size={36}
              color={context.theme.onBgSearch}
              backgroundColor={context.theme.bgSearch}
            />
          </TouchableOpacity>
        </View>
      </View>
      {backPressed || (
        <FlatList
          data={filteredTokenList}
          renderItem={renderItem}
          keyExtractor={(item: ERC20 | AvaxToken) => item.symbol}
          ListEmptyComponent={emptyView}
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
