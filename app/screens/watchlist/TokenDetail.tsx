import React, {FC, useLayoutEffect, useState} from 'react';
import {Dimensions, Pressable, ScrollView, View} from 'react-native';
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
import {RootStackParamList} from 'navigation/WalletScreenStack';
import {StackNavigationProp} from '@react-navigation/stack';
import ChartSelector, {
  ChartType,
} from 'screens/watchlist/components/ChartSelector';
import OvalTagBg from 'components/OvalTagBg';
import AvaButton from 'components/AvaButton';
import {
  VictoryAxis,
  VictoryCandlestick,
  VictoryChart,
  VictoryTheme,
} from 'victory-native';
import {largeCurrencyFormatter, truncateAddress} from 'utils/Utils';
import {useTokenDetail} from 'screens/watchlist/useTokenDetail';

export function formatMarketNumbers(value: number) {
  return value === 0 ? ' -' : largeCurrencyFormatter(value, 1);
}

const TokenDetail: FC<any> = () => {
  const {theme} = useApplicationContext();
  const [showLineChart, setShowLineChart] = useState(true);
  const {setOptions} = useNavigation<StackNavigationProp<RootStackParamList>>();
  const tokenAddress =
    useRoute<RouteProp<RootStackParamList>>()?.params?.address;
  const {
    isFavorite,
    openMoonPay,
    openUrl,
    urlHostname,
    handleFavorite,
    marketTotalSupply,
    currencyFormatter,
    twitterHandle,
    marketCirculatingSupply,
    marketVolume,
    marketCapRank,
    marketCap,
    chartData,
    token,
    ranges,
  } = useTokenDetail(tokenAddress);

  const defaultAreaChartFillGradient = (
    props: GradientProps,
    isNegative: boolean,
  ) => {
    return (
      <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" {...props}>
        <Stop
          stopColor={isNegative ? '#FF0000' : '#53C26E'}
          offset="0%"
          stopOpacity="0.5"
        />
        <Stop stopColor={theme.listItemBg} offset="100%" stopOpacity="0.2" />
      </LinearGradient>
    );
  };

  function openTwitter() {
    // data will come from somewhere, something like
    // token.twitterHandle
    openUrl(`https://twitter.com/${twitterHandle}`);
  }

  function openWebsite() {
    if (urlHostname) {
      openUrl('https://' + urlHostname);
    }
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
          <AvaText.Heading3 currency>
            {token?.priceUSD?.toFixed(10)}
          </AvaText.Heading3>
        }
        rightComponent={
          <ChartSelector
            onChartChange={chart => {
              setShowLineChart(chart === ChartType.LINE);
            }}
          />
        }
      />
      <Space y={8} />
      <View
        style={{height: 120, justifyContent: 'center', alignItems: 'center'}}>
        {showLineChart ? (
          <SlideAreaChart
            animated={false}
            style={{
              marginTop: 32,
              backgroundColor: theme.transparent,
            }}
            shouldCancelWhenOutside={false}
            data={chartData}
            xScale={'time'}
            paddingBottom={8}
            alwaysShowIndicator={true}
            chartPaddingTop={24}
            // callbackWithX={x => console.log(x)}
            // callbackWithY={y => }
            toolTipProps={{
              toolTipTextRenderers: [
                ({scaleY, y, x}) => ({
                  text: currencyFormatter(
                    scaleY.invert(y).toFixed(6).toString(),
                  ),
                }),
              ],
            }}
            cursorProps={{
              cursorLine: false,
              cursorMarkerHeight: 18,
              cursorMarkerWidth: 18,
              cursorColor: theme.alternateBackground,
              cursorBorderColor: theme.alternateBackground,
            }}
            chartLineColor={
              ranges.diffValue < 0 ? theme.colorError : theme.colorSuccess
            }
            chartLineWidth={2}
            yAxisProps={{
              horizontalLineColor: theme.transparent,
              verticalLineColor: theme.transparent,
              interval: 5,
            }}
            renderFillGradient={props =>
              defaultAreaChartFillGradient(props, ranges.diffValue < 0)
            }
            xRange={[ranges.minDate, ranges.maxDate]}
            yRange={[ranges.minPrice, ranges.maxPrice]}
          />
        ) : (
          <VictoryChart theme={VictoryTheme.material} height={160}>
            <VictoryAxis
              scale={'time'}
              tickFormat={t => `${t}`}
              fixLabelOverlap
              style={{
                grid: {stroke: 'transparent'},
                axis: {stroke: 'transparent'},
                ticks: {stroke: 'transparent'},
                tickLabels: {fill: 'transparent'},
              }}
            />
            <VictoryCandlestick
              standalone
              candleColors={{
                positive: theme.colorSuccess,
                negative: theme.colorError,
              }}
              candleRatio={0.2}
              data={[
                {
                  x: new Date(2016, 6, 1),
                  open: 5,
                  close: 10,
                  high: 15,
                  low: 0,
                },
                {
                  x: new Date(2016, 6, 2),
                  open: 10,
                  close: 15,
                  high: 20,
                  low: 5,
                },
                {
                  x: new Date(2016, 6, 3),
                  open: 15,
                  close: 20,
                  high: 22,
                  low: 10,
                },
                {
                  x: new Date(2016, 6, 4),
                  open: 20,
                  close: 10,
                  high: 25,
                  low: 7,
                },
                {
                  x: new Date(2016, 6, 5),
                  open: 10,
                  close: 8,
                  high: 15,
                  low: 5,
                },
              ]}
            />
          </VictoryChart>
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
            <AvaText.Body2>{`Rank: ${marketCapRank}`}</AvaText.Body2>
          </OvalTagBg>
        }
      />

      {/* Market Cap & Contact Address */}
      <AvaListItem.Base
        title={<AvaText.Body2>Market Cap</AvaText.Body2>}
        titleAlignment={'flex-start'}
        rightComponentHorizontalAlignment={'flex-start'}
        paddingVertical={4}
        subtitle={
          <AvaText.Heading3>${formatMarketNumbers(marketCap)}</AvaText.Heading3>
        }
        rightComponent={
          <View
            style={{justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <AvaText.Body2>Contract Address</AvaText.Body2>
            <AvaText.Heading3>{truncateAddress(tokenAddress)}</AvaText.Heading3>
          </View>
        }
      />

      {/* 24H Volume & Website */}
      <AvaListItem.Base
        title={<AvaText.Body2>24h Volume</AvaText.Body2>}
        titleAlignment={'flex-start'}
        rightComponentHorizontalAlignment={'flex-start'}
        paddingVertical={4}
        subtitle={
          <AvaText.Heading3>
            ${formatMarketNumbers(marketVolume)}
          </AvaText.Heading3>
        }
        rightComponent={
          <View
            style={{justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <AvaText.Body2 textStyle={{alignSelf: 'flex-start'}}>
              Website
            </AvaText.Body2>
            <AvaText.Heading3
              textStyle={{color: '#0A84FF'}}
              onPress={openWebsite}>
              {urlHostname}
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
        subtitle={
          <AvaText.Heading3>
            ${formatMarketNumbers(marketCirculatingSupply)}
          </AvaText.Heading3>
        }
        rightComponent={
          <View
            style={{justifyContent: 'flex-start', alignItems: 'flex-start'}}>
            <AvaText.Body2>Twitter</AvaText.Body2>
            <AvaText.Heading3
              textStyle={{color: '#0A84FF'}}
              onPress={openTwitter}>
              @{twitterHandle}
            </AvaText.Heading3>
          </View>
        }
      />

      {/* Total Supply */}
      <AvaListItem.Base
        title={<AvaText.Body2>Total Supply</AvaText.Body2>}
        titleAlignment={'flex-start'}
        paddingVertical={4}
        subtitle={
          <AvaText.Heading3>
            ${formatMarketNumbers(marketTotalSupply)}
          </AvaText.Heading3>
        }
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
