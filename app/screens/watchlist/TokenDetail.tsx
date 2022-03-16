import React, {FC, useEffect, useLayoutEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import Avatar from 'components/Avatar';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
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
import SparklineChart from 'components/SparklineChart';
import {Row} from 'components/Row';
import MarketMovement from 'screens/watchlist/components/MarketMovement';
import {ViewOnceInformation} from 'Repo';

const WIDOW_WIDTH = Dimensions.get('window').width;

export function formatMarketNumbers(value: number) {
  return value === 0 ? ' -' : largeCurrencyFormatter(value, 1);
}

const TokenDetail: FC<any> = () => {
  const {theme} = useApplicationContext();
  const {saveViewOnceInformation, infoHasBeenShown, viewOnceInfo} =
    useApplicationContext().repo.informationViewOnceRepo;
  const [showLineChart, setShowLineChart] = useState(true);
  const {setOptions} = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showChartInstruction, setShowChartInstruction] = useState(false);
  const tokenAddress =
    useRoute<RouteProp<RootStackParamList>>()?.params?.address;
  const {
    isFavorite,
    openMoonPay,
    openUrl,
    urlHostname,
    handleFavorite,
    marketTotalSupply,
    twitterHandle,
    marketCirculatingSupply,
    marketVolume,
    marketCapRank,
    marketCap,
    chartData,
    token,
    ranges,
    changeChartDays,
  } = useTokenDetail(tokenAddress);

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

  useEffect(() => {
    if (!infoHasBeenShown(ViewOnceInformation.CHART_INTERACTION)) {
      setShowChartInstruction(true);
      saveViewOnceInformation([
        ...viewOnceInfo,
        ViewOnceInformation.CHART_INTERACTION,
      ]);
    }
  }, []);

  useLayoutEffect(() => {
    setOptions({
      headerRight: () => (
        <Pressable style={{paddingEnd: 8}} onPress={handleFavorite}>
          <StarSVG selected={isFavorite} />
        </Pressable>
      ),
    });
  }, [isFavorite]);

  const getOverlayContent = () => {
    // loading chart data
    let content;
    if (!chartData) {
      content = <ActivityIndicator />;
    }

    // chart data is empty, could not be retrieved
    if (chartData && chartData.length === 0) {
      content = (
        <>
          <AvaText.Heading2 color={'white'}>
            No chart data available
          </AvaText.Heading2>
          <AvaText.Body3 color={'white'}>
            We are unable to retrieve chart data for this token at this time.
          </AvaText.Body3>
        </>
      );
    }

    // if we have data and it's 1st time user seing it, show instruction
    if (chartData && showChartInstruction) {
      content = (
        <>
          <AvaText.Heading2 color={'white'}>Hold and Drag</AvaText.Heading2>
          <AvaText.Body3
            color={'white'}
            textStyle={{textAlignVertical: 'center'}}>
            Hold and drag over chart for precise price and date
          </AvaText.Body3>
          <AvaButton.PrimaryMedium
            onPress={() => setShowChartInstruction(!showChartInstruction)}>
            Got it
          </AvaButton.PrimaryMedium>
        </>
      );
    }

    if (content) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#00000080',
              marginHorizontal: 32,
            },
          ]}>
          {content}
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView style={{paddingHorizontal: 8, flex: 1}}>
      <View>
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
            <Row style={{alignItems: 'center'}}>
              <AvaText.Heading3
                currency
                hideTrailingCurrency
                textStyle={{marginEnd: 8}}>
                {token?.priceUSD?.toFixed(6)}
              </AvaText.Heading3>
              <MarketMovement
                priceChange={ranges.diffValue}
                percentChange={ranges.percentChange}
              />
            </Row>
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
            <View>
              <AvaText.Caption
                textStyle={{
                  alignSelf: 'flex-end',
                  color: theme.colorText1,
                  marginBottom: -10,
                }}
                currency
                hideTrailingCurrency>
                {ranges.maxPrice}
              </AvaText.Caption>
              <SparklineChart
                interactive
                data={chartData}
                yRange={[ranges.minPrice, ranges.maxPrice]}
                xRange={[ranges.minDate, ranges.maxDate]}
                negative={ranges.diffValue < 0}
                width={WIDOW_WIDTH - 32} // padding
                height={120}
              />
              <AvaText.Caption
                textStyle={{alignSelf: 'flex-end', color: theme.colorText1}}
                currency
                hideTrailingCurrency>
                {ranges.minPrice}
              </AvaText.Caption>
            </View>
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
          {getOverlayContent()}
        </View>

        <Space y={22} />

        {/* this will change once data component purpose and interaction is defined */}
        <TabViewAva
          renderCustomLabel={title => (
            <AvaText.Heading3>{title}</AvaText.Heading3>
          )}
          onTabIndexChange={index => {
            changeChartDays(
              index === 0
                ? 1 // one day
                : index === 1
                ? 7 // seven days - 1 week
                : index === 2
                ? 30 // 30 days - 1 month
                : index === 3
                ? 90 // 90 days - 3 months
                : 365, // 365 days - 1 year
            );
          }}>
          <View title={'24H'} />
          <View title={'1W'} />
          <View title={'1M'} />
          <View title={'3M'} />
          <View title={'1Y'} />
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
            <AvaText.Heading3>
              {formatMarketNumbers(marketCap)}
            </AvaText.Heading3>
          }
          rightComponent={
            <View
              style={{
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                flex: 1,
              }}>
              <AvaText.Body2>Contract Address</AvaText.Body2>
              <AvaText.Heading3>
                {truncateAddress(tokenAddress)}
              </AvaText.Heading3>
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
              {formatMarketNumbers(marketVolume)}
            </AvaText.Heading3>
          }
          rightComponent={
            <View
              style={{
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                flex: 1,
              }}>
              <AvaText.Body2>Website</AvaText.Body2>
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
              {formatMarketNumbers(marketCirculatingSupply)}
            </AvaText.Heading3>
          }
          rightComponent={
            <View
              style={{
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                flex: 1,
              }}>
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
              {formatMarketNumbers(marketTotalSupply)}
            </AvaText.Heading3>
          }
        />
        {token?.isAvax && (
          <AvaButton.Base onPress={openMoonPay}>
            <OvalTagBg color={theme.listItemBg} style={{height: 48}}>
              <AvaText.ButtonLarge>Buy {token?.symbol}</AvaText.ButtonLarge>
            </OvalTagBg>
          </AvaButton.Base>
        )}
      </View>
    </ScrollView>
  );
};

export default TokenDetail;
