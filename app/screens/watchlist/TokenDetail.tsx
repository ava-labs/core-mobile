import React, {FC, useEffect, useLayoutEffect, useState} from 'react';
import {Dimensions, Pressable, ScrollView, Text, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import Avatar from 'components/Avatar';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {
  GradientProps,
  SlideAreaChart,
} from '@connectedcars/react-native-slide-charts';
import {LinearGradient, Stop} from 'react-native-svg';
import TabViewAva from 'components/TabViewAva';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import StarSVG from 'components/svg/StarSVG';
import {getTokenUID} from 'utils/TokenTools';
import {useSearchableTokenList} from 'screens/portfolio/useSearchableTokenList';
import {TokenWithBalance} from '@avalabs/wallet-react-components';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import {StackNavigationProp} from '@react-navigation/stack';
import ChartSelector, {
  ChartType,
} from 'screens/watchlist/components/ChartSelector';
import OvalTagBg from 'components/OvalTagBg';
import useInAppBrowser from 'hooks/useInAppBrowser';
import AvaButton from 'components/AvaButton';

export const defaultAreaChartFillGradient = (props: GradientProps) => {
  return (
    <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" {...props}>
      <Stop stopColor="#FF0000" offset="0%" stopOpacity="0.5" />
      <Stop stopColor="#000000" offset="100%" stopOpacity="0.2" />
    </LinearGradient>
  );
};

const screenWidth = Dimensions.get('window').width;

const TokenDetail: FC<any> = () => {
  const {theme, repo} = useApplicationContext();
  const {watchlistFavorites, saveWatchlistFavorites} =
    repo.watchlistFavoritesRepo;
  const {filteredTokenList} = useSearchableTokenList(false);
  const {setOptions} = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isFavorite, setIsFavorite] = useState(true);
  const [token, setToken] = useState<TokenWithBalance>();
  const [showLineChart, setShowLineChart] = useState(true);
  const {openMoonPay} = useInAppBrowser();

  const {tokenId} = useRoute<RouteProp<RootStackParamList>>().params;

  useEffect(() => {
    if (filteredTokenList) {
      const result = filteredTokenList.filter(
        tk => getTokenUID(tk) === tokenId,
      );
      if (result.length > 0) {
        setToken(result[0]);
      }
    }
  }, [filteredTokenList]);

  useEffect(() => {
    setIsFavorite(
      watchlistFavorites.filter(value => value === tokenId).length > 0,
    );
  }, [watchlistFavorites]);

  function handleFavorite() {
    if (isFavorite) {
      const index = watchlistFavorites.indexOf(tokenId);
      if (index > -1) {
        watchlistFavorites.splice(index, 1);
        saveWatchlistFavorites(watchlistFavorites);
      }
    } else {
      watchlistFavorites.push(tokenId);
    }
    setIsFavorite(!isFavorite);
  }

  useLayoutEffect(() => {
    setOptions({
      headerRight: () => (
        <Pressable style={{paddingEnd: 8}} onPress={handleFavorite}>
          <StarSVG selected={isFavorite} />
        </Pressable>
      ),
    });
  }, [isFavorite]);

  const renderCustomLabel = (title: string, focused: boolean) => {
    return (
      <AvaText.Heading3
        textStyle={{color: focused ? theme.colorText1 : theme.colorText2}}>
        {title}
      </AvaText.Heading3>
    );
  };

  return (
    <ScrollView style={{paddingHorizontal: 8, flex: 1}}>
      <AvaListItem.Base
        title={<AvaText.Heading1>{token?.name}</AvaText.Heading1>}
        titleAlignment={'flex-start'}
        subtitle={token?.symbol}
        leftComponent={token && <Avatar.Token token={token} size={48} />}
      />
      <AvaListItem.Base
        title={<AvaText.Body2>Price</AvaText.Body2>}
        titleAlignment={'flex-start'}
        subtitle={
          <Text>
            <AvaText.Heading3 currency>{token?.priceUSD}</AvaText.Heading3>
            <AvaText.Body3 color={theme.colorSuccess}>
              +$1.13(1.29%)
            </AvaText.Body3>
          </Text>
        }
        rightComponent={
          <ChartSelector
            onChartChange={chart => {
              setShowLineChart(chart === ChartType.LINE);
            }}
          />
        }
      />
      <View
        style={{height: 110, justifyContent: 'center', alignItems: 'center'}}>
        {showLineChart ? (
          <SlideAreaChart
            scrollable
            style={{
              marginTop: 32,
              backgroundColor: theme.transparent,
            }}
            width={screenWidth + 24}
            shouldCancelWhenOutside={false}
            data={[
              {x: 1, y: 5},
              {x: 2, y: 6},
              {x: 3, y: 11},
              {x: 4, y: 50},
              {x: 5, y: 3},
              {x: 6, y: 34},
              {x: 7, y: 5},
              {x: 8, y: 6},
              {x: 9, y: 11},
              {x: 10, y: 50},
              {x: 11, y: 3},
              {x: 12, y: 34},
              {x: 27, y: 11},
            ]}
            axisWidth={16}
            axisHeight={16}
            paddingBottom={8}
            alwaysShowIndicator={true}
            callbackWithX={x => console.log(x)}
            callbackWithY={y => console.log(y)}
            toolTipProps={{
              toolTipTextRenderers: [
                ({scaleY, y}) => ({
                  text: scaleY.invert(y).toFixed(1).toString(),
                }),
              ],
            }}
            showIndicatorCallback={opacity =>
              console.log('opacity: ' + opacity)
            }
            cursorProps={{
              cursorLine: false,
              cursorMarkerHeight: 18,
              cursorMarkerWidth: 18,
              cursorColor: theme.alternateBackground,
              cursorBorderColor: theme.alternateBackground,
            }}
            chartLineColor={theme.colorError}
            chartLineWidth={2}
            yAxisProps={{
              horizontalLineColor: theme.transparent,
              verticalLineColor: theme.transparent,
              interval: 5,
            }}
            renderFillGradient={defaultAreaChartFillGradient}
          />
        ) : (
          <AvaText.Heading3>Candle Chart Coming Soon</AvaText.Heading3>
        )}
      </View>

      <Space y={22} />

      {/* this will change once data component purpose and interaction is defined */}
      <TabViewAva renderCustomLabel={renderCustomLabel}>
        <View title={'24H'} />
        <View title={'1W'} />
        <View title={'1M'} />
        <View title={'3M'} />
        <View title={'1Y'} />
        <View title={'ALL'} />
      </TabViewAva>

      {/* Market Data & Rank */}
      <AvaListItem.Base
        title={<AvaText.Heading2>Market Data</AvaText.Heading2>}
        paddingVertical={4}
        titleAlignment={'flex-start'}
        rightComponent={
          <OvalTagBg
            color={theme.colorBg3}
            style={{height: 21, paddingVertical: 0}}>
            <AvaText.Body2>Rank: 8</AvaText.Body2>
          </OvalTagBg>
        }
      />

      {/* Market Cap & Contact Address */}
      <AvaListItem.Base
        title={<AvaText.Body2>Market Cap</AvaText.Body2>}
        titleAlignment={'flex-start'}
        rightComponentHorizontalAlignment={'flex-start'}
        paddingVertical={4}
        subtitle={<AvaText.Heading3>$23.4B</AvaText.Heading3>}
        rightComponent={
          <View
            style={{justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <AvaText.Body2>Contract Address</AvaText.Body2>
            <AvaText.Heading3>0xB2d...232d</AvaText.Heading3>
          </View>
        }
      />

      {/* 24H Volume & Website */}
      <AvaListItem.Base
        title={<AvaText.Body2>24h Volume</AvaText.Body2>}
        titleAlignment={'flex-start'}
        rightComponentHorizontalAlignment={'flex-start'}
        paddingVertical={4}
        subtitle={<AvaText.Heading3>$1.4B</AvaText.Heading3>}
        rightComponent={
          <View
            style={{justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <AvaText.Body2 textStyle={{alignSelf: 'flex-start'}}>
              Website
            </AvaText.Body2>
            <AvaText.Heading3 textStyle={{color: '#0A84FF'}}>
              avax.network
            </AvaText.Heading3>
          </View>
        }
      />

      {/*  Available Supply & Twitter */}
      <AvaListItem.Base
        title={<AvaText.Body2>Available Supply</AvaText.Body2>}
        titleAlignment={'flex-start'}
        rightComponentHorizontalAlignment={'flex-start'}
        paddingVertical={4}
        subtitle={<AvaText.Heading3>$220.3M</AvaText.Heading3>}
        rightComponent={
          <View
            style={{justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <AvaText.Body2>Twitter</AvaText.Body2>
            <AvaText.Heading3 textStyle={{color: '#0A84FF'}}>
              @avalancheavax
            </AvaText.Heading3>
          </View>
        }
      />

      {/* Total Supply */}
      <AvaListItem.Base
        title={<AvaText.Body2>Total Suppy</AvaText.Body2>}
        titleAlignment={'flex-start'}
        paddingVertical={4}
        subtitle={<AvaText.Heading3>$377.7M</AvaText.Heading3>}
      />

      <AvaButton.Base onPress={openMoonPay}>
        <OvalTagBg color={theme.listItemBg} style={{height: 48}}>
          <AvaText.ButtonLarge>Buy {token?.symbol}</AvaText.ButtonLarge>
        </OvalTagBg>
      </AvaButton.Base>
    </ScrollView>
  );
};

export default TokenDetail;
