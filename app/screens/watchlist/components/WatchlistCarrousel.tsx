import React, {FC, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  ListRenderItemInfo,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import Avatar from 'components/Avatar';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AvaButton from 'components/AvaButton';
import {
  ERC20WithBalance,
  useWalletStateContext,
} from '@avalabs/wallet-react-components';
import AddSVG from 'components/svg/AddSVG';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {CG_AVAX_TOKEN_ID} from 'screens/watchlist/WatchlistView';
import Coingecko, {ChartData} from 'utils/Coingecko';
import MarketMovement from 'screens/watchlist/components/MarketMovement';
import {Opacity85} from 'resources/Constants';

interface Props {
  style?: StyleProp<View>;
}

const WatchlistCarrousel: FC<Props> = () => {
  const {theme, repo} = useApplicationContext();
  // @ts-ignore avaxToken, erc20Tokens exist in walletContext
  const {avaxToken, erc20Tokens} = useWalletStateContext();
  const {watchlistFavorites} = repo.watchlistFavoritesRepo;
  const navigation = useNavigation<StackNavigationProp<any>>();

  const favoriteTokens = useMemo(
    () =>
      [{...avaxToken, address: CG_AVAX_TOKEN_ID}, ...erc20Tokens].filter(
        token => watchlistFavorites.includes(token.address),
      ) ?? [],
    [erc20Tokens, avaxToken],
  );

  function goToWatchlist() {
    navigation.navigate(AppNavigation.Tabs.Watchlist);
  }

  const EmptyItem = useMemo(
    () => (
      <AvaButton.Base
        onPress={goToWatchlist}
        style={[style.item, {backgroundColor: theme.colorBg2 + Opacity85}]}>
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

  const renderItem = (item: ListRenderItemInfo<ERC20WithBalance>) => {
    const token = item.item;
    return (
      <CarrouselItem
        token={token}
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.TokenDetail, {
            address: token.address,
          });
        }}
      />
    );
  };

  return (
    <View>
      <FlatList
        data={favoriteTokens}
        renderItem={renderItem}
        keyExtractor={(item: ERC20WithBalance) => item.address}
        horizontal
        bounces
        ListEmptyComponent={EmptyItem}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{margin: 4}} />}
      />
    </View>
  );
};

interface CarrouselItemProps {
  token: ERC20WithBalance;
  onPress: () => void;
}

const CarrouselItem: FC<CarrouselItemProps> = ({token, onPress}) => {
  const theme = useApplicationContext().theme;
  const [chartData, setChartData] = useState<ChartData>();

  useEffect(() => {
    (async () => {
      try {
        const data = await Coingecko.fetchChartData(token.address, 1);
        setChartData(data);
      } catch (e) {
        //ignored
      }
    })();
  }, []);

  return (
    <AvaButton.Base
      key={token.address}
      onPress={onPress}
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
      <MarketMovement
        priceChange={chartData?.ranges?.diffValue ?? 0}
        percentChange={chartData?.ranges?.percentChange ?? 0}
        hideDifference
      />
    </AvaButton.Base>
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
