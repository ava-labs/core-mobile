import React, {FC} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import Avatar from 'components/Avatar';
import {Space} from 'components/Space';
import {
  GradientProps,
  SlideAreaChart,
} from '@connectedcars/react-native-slide-charts';
import {LinearGradient, Stop} from 'react-native-svg';

interface Props {
  tokenName: string;
  tokenPrice: string;
  tokenPriceUsd?: string;
  image?: string;
  symbol?: string;
  onPress?: () => void;
  rank?: number;
}

const WatchListItem: FC<Props> = ({
  tokenName,
  tokenPrice,
  tokenPriceUsd,
  image,
  symbol,
  onPress,
  rank,
}) => {
  const theme = useApplicationContext().theme;

  const defaultAreaChartFillGradient = (props: GradientProps) => {
    return (
      <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" {...props}>
        <Stop stopColor="#FF0000" offset="0%" stopOpacity="0.5" />
        <Stop stopColor={theme.listItemBg} offset="100%" stopOpacity="0.2" />
      </LinearGradient>
    );
  };

  const usdBalance = () => {
    if (tokenPriceUsd) {
      return (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <SlideAreaChart
            style={{
              backgroundColor: theme.transparent,
            }}
            width={120}
            height={80}
            animated={false}
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
            axisWidth={35}
            paddingBottom={16}
            alwaysShowIndicator={false}
            chartLineColor={theme.colorError}
            chartLineWidth={1}
            cursorProps={{
              displayCursor: false,
            }}
            yAxisProps={{
              horizontalLineColor: theme.transparent,
              verticalLineColor: theme.transparent,
              interval: 1,
            }}
            renderFillGradient={defaultAreaChartFillGradient}
          />
          <View>
            <AvaText.Heading3 currency ellipsizeMode={'tail'}>
              43034.02
            </AvaText.Heading3>
            <AvaText.Caption textStyle={{color: theme.colorSuccess}}>
              +$8.55 (9.923%)
            </AvaText.Caption>
          </View>
        </View>
      );
    }

    if (!tokenPriceUsd && tokenPrice === '0') {
      return (
        <AvaText.Heading3 currency ellipsizeMode={'tail'}>
          {tokenPriceUsd}
        </AvaText.Heading3>
      );
    }

    return null;
  };

  return (
    <View>
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
        rightComponent={usdBalance()}
        onPress={onPress}
      />
    </View>
  );
};

export default React.memo(WatchListItem);
