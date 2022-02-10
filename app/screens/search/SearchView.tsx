import React from 'react';
import {FlatList, ListRenderItemInfo, Platform, Text, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import SearchListItem from 'screens/search/SearchListItem';
import AvaText from 'components/AvaText';
import AddSVG from 'components/svg/AddSVG';
import CarrotSVG from 'components/svg/CarrotSVG';
import AvaButton from 'components/AvaButton';
import {Opacity50} from 'resources/Constants';
import Loader from 'components/Loader';
import {getTokenUID} from 'utils/TokenTools';
import SearchBar from 'components/SearchBar';

function SearchView(): JSX.Element {
  const {
    filteredTokenList,
    searchText,
    setSearchText,
    setShowZeroBalanceList,
    showZeroBalanceList,
    loadTokenList,
  } = useSearchableTokenList(false);

  // const navigation = useNavigation<PortfolioNavigationProp>();

  function handleRefresh() {
    loadTokenList();
  }

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
        symbol={token.symbol}
        position={item.index + 1}
        image={logoUri}
        isShowingZeroBalanceForToken={showZeroBalanceList[getTokenUID(token)]}
        onSwitchChanged={value => {
          showZeroBalanceList[getTokenUID(token)] = value;
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

  const descriptionPadding = Platform.OS === 'ios' ? 24 : 32;

  return (
    <View style={{flex: 1}}>
      <AvaText.Body1
        textStyle={{alignSelf: 'center', paddingStart: descriptionPadding}}>
        Add or remove tokens without balance
      </AvaText.Body1>
      <View style={{marginHorizontal: 16}}>
        <SearchBar onTextChanged={handleSearch} searchText={searchText} />
      </View>
      {!filteredTokenList ? (
        <Loader />
      ) : (
        <FlatList
          data={filteredTokenList}
          renderItem={renderItem}
          onRefresh={handleRefresh}
          // ListHeaderComponent={
          //   <AddCustomTokenButton
          //     onPress={() =>
          //       navigation.navigate(AppNavigation.Wallet.AddCustomToken)
          //     }
          //   />
          // }
          refreshing={false}
          keyExtractor={(item: TokenWithBalance) => getTokenUID(item)}
          ListEmptyComponent={emptyView}
        />
      )}
    </View>
  );
}

// not currently in use due to lack of SKD support
const AddCustomTokenButton = ({onPress}: {onPress: () => void}) => {
  const {theme} = useApplicationContext();
  return (
    <AvaButton.Base
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colorBg3 + Opacity50,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 16,
        marginHorizontal: 16,
        padding: 16,
      }}>
      <AddSVG color={theme.colorPrimary1} hideCircle size={24} />
      <AvaText.Body1 textStyle={{marginLeft: 12, flex: 1}}>
        Add custom token
      </AvaText.Body1>
      <CarrotSVG />
    </AvaButton.Base>
  );
};

export default SearchView;
