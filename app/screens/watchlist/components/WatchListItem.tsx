import React, {FC} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import Avatar from 'components/Avatar';
import {Space} from 'components/Space';
import {LineChart} from 'react-native-svg-charts';

interface Props {
  tokenName: string;
  tokenPrice: string;
  tokenPriceUsd?: string;
  image?: string;
  symbol?: string;
  onPress?: () => void;
}

const WatchListItem: FC<Props> = ({
  tokenName,
  tokenPrice,
  tokenPriceUsd,
  image,
  symbol,
  onPress,
}) => {
  const theme = useApplicationContext().theme;

  // const chartConfig: AbstractChartConfig = {
  //   backgroundGradientFromOpacity: 0,
  //   backgroundGradientToOpacity: 0,
  //   color: () => 'red',
  //   strokeWidth: 1, // optional, default 3
  //   barPercentage: 0.5,
  //   barRadius: 10,
  //   useShadowColorFromDataset: false, // optional
  // };

  const data = [
    -100, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80,
  ];

  const usdBalance = () => {
    if (tokenPriceUsd) {
      return (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <LineChart
            style={{flex: 1, minWidth: 80}}
            data={data}
            svg={{stroke: 'rgb(255, 0, 0)'}}
            contentInset={{top: 10, bottom: 10}}
          />
          {/*<LineChart*/}
          {/*  data={{*/}
          {/*    labels: [],*/}
          {/*    datasets: [*/}
          {/*      {*/}
          {/*        data: [*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*          Math.random() * 100,*/}
          {/*        ],*/}
          {/*      },*/}
          {/*    ],*/}
          {/*  }}*/}
          {/*  width={130}*/}
          {/*  height={30}*/}
          {/*  chartConfig={chartConfig}*/}
          {/*  withDots={false}*/}
          {/*  withHorizontalLabels={false}*/}
          {/*  withVerticalLabels={false}*/}
          {/*  withHorizontalLines={false}*/}
          {/*  withVerticalLines={false}*/}
          {/*/>*/}
          <Space x={8} />
          <View>
            <AvaText.Heading3 currency ellipsizeMode={'tail'}>
              {tokenPriceUsd}
            </AvaText.Heading3>
            <Space y={8} />
            <AvaText.Caption textStyle={{color: theme.colorSuccess}}>
              +$8.55 (9.923%)
            </AvaText.Caption>
          </View>
        </View>
      );
    }

    if (!tokenPriceUsd && tokenPrice === '0') {
      return (
        <AvaListItem.CurrencyAmount
          justifyContent={'flex-end'}
          value={
            <AvaText.Heading3 ellipsizeMode={'tail'}>
              {tokenPriceUsd}
            </AvaText.Heading3>
          }
          currency={<AvaText.Heading3>{''}</AvaText.Heading3>}
        />
      );
    }

    return null;
  };

  return (
    <View
      style={{
        marginVertical: 4,
        borderRadius: 8,
        backgroundColor: theme.colorBg3,
      }}>
      <AvaListItem.Base
        title={<AvaText.Heading2>{symbol}</AvaText.Heading2>}
        titleAlignment={'flex-start'}
        subtitle={tokenName}
        leftComponent={
          <Avatar.Custom
            name={tokenName}
            symbol={symbol}
            logoUri={image}
            size={40}
          />
        }
        rightComponent={usdBalance()}
        onPress={onPress}
      />
    </View>
  );
};

export default React.memo(WatchListItem);
