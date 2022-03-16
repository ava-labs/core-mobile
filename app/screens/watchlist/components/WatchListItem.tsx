import React, {FC, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import Avatar from 'components/Avatar';
import {Space} from 'components/Space';
import {
  coinsContractMarketChart,
  ContractMarketChartResponse,
  VsCurrencyType,
} from '@avalabs/coingecko-sdk';
import {WatchlistFilter} from 'screens/watchlist/WatchlistView';
import SparklineChart from 'components/SparklineChart';
import MarketMovement from 'screens/watchlist/components/MarketMovement';
import {Row} from 'components/Row';

interface Props {
  tokenName: string;
  value?: string;
  tokenAddress: string;
  image?: string;
  symbol?: string;
  onPress?: () => void;
  rank?: number;
  filterBy: WatchlistFilter;
}

const WatchListItem: FC<Props> = ({
  tokenName,
  value = '0',
  image,
  symbol,
  onPress,
  rank,
  tokenAddress,
  filterBy,
}) => {
  const theme = useApplicationContext().theme;
  const {selectedCurrency} = useApplicationContext().appHook;
  const [ranges, setRanges] = useState<{
    minDate: number;
    maxDate: number;
    minPrice: number;
    maxPrice: number;
    diffValue: number;
    percentChange: number;
  }>({
    minDate: 0,
    maxDate: 0,
    minPrice: 0,
    maxPrice: 0,
    diffValue: 0,
    percentChange: 0,
  });
  const [chartData, setChartData] = useState<{x: number; y: number}[]>();
  const [rawData, setRawData] = useState<ContractMarketChartResponse>();

  // get coingecko chart data.
  useEffect(() => {
    if (tokenAddress) {
      setTimeout(() => {
        (async () => {
          try {
            const result = await coinsContractMarketChart({
              address: tokenAddress,
              currency: 'usd' as VsCurrencyType,
              days: 1,
              id: 'avalanche',
            });
            setRawData(result);
          } catch (e) {
            // Coingecko does not support all tokens chart data. So here we'll
            // simply set to empty to hide the loading state.
            setChartData([]);
          }
        })();
      }, 3000);
    }
  }, []);

  useEffect(() => {
    if (rawData) {
      const dataPoints =
        filterBy === WatchlistFilter.PRICE
          ? rawData?.prices
          : filterBy === WatchlistFilter.MARKET_CAP
          ? rawData?.marketCaps
          : rawData?.totalVolumes;

      const pd = dataPoints.map(tu => {
        return {x: tu[0], y: tu[1]};
      });

      const dates = dataPoints.map(val => val[0]);
      const prices = dataPoints.map(val => val[1]);

      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const diffValue = prices[prices.length - 1] - prices[0];
      const average = (prices[prices.length - 1] + prices[0]) / 2;
      const percentChange = (diffValue / average) * 100;

      setRanges({
        minDate,
        maxDate,
        minPrice,
        maxPrice,
        diffValue,
        percentChange,
      });
      setChartData(pd);
    }
  }, [filterBy, rawData]);

  const usdBalance = useMemo(() => {
    if (value) {
      return (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {!chartData ? (
            <ActivityIndicator
              style={{alignSelf: 'center'}}
              color={theme.colorPrimary1}
            />
          ) : (
            <View style={{position: 'absolute', left: -40, flex: 1}}>
              <SparklineChart
                width={90}
                height={80}
                animated={false}
                data={chartData}
                yRange={[ranges.minPrice, ranges.maxPrice]}
                xRange={[ranges.minDate, ranges.maxDate]}
                negative={ranges.diffValue < 0}
              />
            </View>
          )}
          <View style={{alignItems: 'flex-end', flex: 1}}>
            <Row style={{alignItems: 'flex-end'}}>
              <AvaText.Heading3 ellipsizeMode={'tail'}>
                {value}
              </AvaText.Heading3>
              <Space x={4} />
              <AvaText.Body3
                textStyle={{color: theme.colorText2, lineHeight: 20}}>
                {selectedCurrency.toUpperCase()}
              </AvaText.Body3>
            </Row>
            <MarketMovement
              priceChange={ranges.diffValue}
              percentChange={ranges.percentChange}
              filterBy={filterBy}
            />
          </View>
        </View>
      );
    }

    return null;
  }, [chartData, ranges]);

  return (
    <AvaListItem.Base
      title={
        <AvaText.Heading2 ellipsizeMode={'tail'}>{symbol}</AvaText.Heading2>
      }
      titleAlignment={'flex-start'}
      subtitle={tokenName}
      embedInCard={false}
      leftComponent={
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          {rank && (
            <>
              <AvaText.Heading3>{rank}</AvaText.Heading3>
              <Space x={9} />
            </>
          )}
          <Avatar.Custom
            name={tokenName}
            symbol={symbol}
            logoUri={image}
            size={32}
          />
        </View>
      }
      rightComponent={usdBalance}
      onPress={onPress}
    />
  );
};

export default React.memo(WatchListItem);
