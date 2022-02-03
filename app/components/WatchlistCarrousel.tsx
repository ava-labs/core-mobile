import React, {FC, useMemo} from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import Avatar from './Avatar';
import AvaText from './AvaText';
import {Space} from 'components/Space';
import AvaButton from './AvaButton';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import {getTokenUID} from 'utils/TokenTools';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import AddSVG from 'components/svg/AddSVG';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';

interface Props {
  style?: StyleProp<View>;
}

const WatchlistCarrousel: FC<Props> = () => {
  const {theme, repo} = useApplicationContext();
  const {filteredTokenList} = useSearchableTokenList();
  const {watchlistFavorites} = repo.watchlistFavoritesRepo;
  const navigation = useNavigation<StackNavigationProp<any>>();

  const filteredData =
    filteredTokenList?.filter(token =>
      watchlistFavorites.includes(getTokenUID(token)),
    ) ?? [];

  function goToWatchlist() {
    navigation.navigate(AppNavigation.Tabs.Watchlist);
  }

  const EmptyItem = useMemo(
    () => (
      <AvaButton.Base
        onPress={goToWatchlist}
        style={[style.item, {backgroundColor: theme.colorBg3}]}>
        <Space y={14} />
        <AddSVG circleColor={'white'} size={24} />
        <Space y={4} />
        <AvaText.ButtonSmall
          textStyle={{
            color: theme.colorText1,
            textAlign: 'center',
            paddingVertical: 8,
          }}>
          Add to Watchlist
        </AvaText.ButtonSmall>
        <Space y={16} />
      </AvaButton.Base>
    ),
    [],
  );

  const renderItem = (item: ListRenderItemInfo<TokenWithBalance>) => {
    const token = item.item;
    const percentChange = (token?.balanceUSD ?? 0).toFixed(2);
    const isNegative = false; // Math.random() < 0.5; //Math.sign(percentChange) === -1;

    return (
      <AvaButton.Base
        key={getTokenUID(token)}
        style={[style.item, {backgroundColor: theme.colorBg3}]}>
        <Avatar.Custom
          name={token.name}
          symbol={token.symbol}
          logoUri={token.logoURI}
        />
        <Space y={4} />
        <AvaText.ButtonSmall textStyle={{color: theme.colorText1}}>
          {token?.symbol?.toUpperCase()}
        </AvaText.ButtonSmall>
        <Space y={16} />
        <AvaText.Caption
          textStyle={{
            color: isNegative ? theme.colorError : theme.colorSuccess,
          }}>
          {`${
            isNegative
              ? percentChange
              : percentChange.toString().split('-').pop()
          }%`}
        </AvaText.Caption>
      </AvaButton.Base>
    );
  };

  return (
    <View>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item: TokenWithBalance) => getTokenUID(item)}
        horizontal
        bounces
        ListEmptyComponent={EmptyItem}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{margin: 4}} />}
      />
    </View>
  );
};

const style = StyleSheet.create({
  item: {
    height: 96,
    width: 72,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
  },
});

export default WatchlistCarrousel;
