import React, {FC, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import Avatar from 'components/Avatar';
import {Space} from 'components/Space';
import {WatchlistFilter} from 'screens/watchlist/WatchlistView';
import SparklineChart from 'components/SparklineChart';
import MarketMovement from 'screens/watchlist/components/MarketMovement';
import {Row} from 'components/Row';
import Coingecko from 'utils/Coingecko';

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

  // get coingecko chart data.
  useEffect(() => {
    if (tokenAddress) {
      setTimeout(() => {
        (async () => {
          try {
            const result = await Coingecko.fetchChartData(tokenAddress, 1);
            setChartData(result.dataPoints);
            setRanges(result.ranges);
          } catch (e) {
            // Coingecko does not support all tokens chart data. So here we'll
            // simply set to empty to hide the loading state.
            setChartData([]);
          }
        })();
      }, 3000);
    }
  }, []);

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
