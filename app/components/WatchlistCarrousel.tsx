import React, {FC} from 'react';
import {FlatList, ListRenderItemInfo, StyleProp, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import Avatar from './Avatar';
import AvaText from './AvaText';
import {Space} from 'components/Space';
import Coins from 'assets/coins.json';
import AvaButton from './AvaButton';

interface Props {
  style?: StyleProp<View>;
}

const WatchlistCarrousel: FC<Props> = () => {
  const theme = useApplicationContext().theme;
  const data = Coins;

  const renderItem = (item: ListRenderItemInfo<any>) => {
    const token = item.item;
    const percentChange = (token?.ath_change_percentage ?? 0).toFixed(2);
    const isNegative = false; // Math.random() < 0.5; //Math.sign(percentChange) === -1;

    return (
      <AvaButton.Base
        key={token.id}
        style={[
          {
            height: 96,
            width: 72,
            backgroundColor: theme.colorBg3,
            alignItems: 'center',
            borderRadius: 10,
            paddingVertical: 8,
          },
        ]}>
        <Avatar.Custom
          name={token.name}
          symbol={token.symbol}
          logoUri={token.image}
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
        data={data}
        renderItem={renderItem}
        keyExtractor={(item: any) => item?.id}
        horizontal
        bounces
        ItemSeparatorComponent={() => <View style={{margin: 4}} />}
      />
    </View>
  );
};

export default WatchlistCarrousel;
