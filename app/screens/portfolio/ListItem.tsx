import React, {FC, useContext} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import ButtonAvaTextual from 'components/ButtonAvaTextual';
import CarrotSVG from 'components/svg/CarrotSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';

interface Props {
  coinName: string;
  coinPrice: number;
  avaxPrice: number;
}
const BaseListItem: FC<Props> = props => {
  const context = useContext(ApplicationContext);

  return (
    <View style={{flex: 1, paddingVertical: 16}}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}>
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          <View
            style={{
              paddingHorizontal: 16,
              backgroundColor: 'red',
              width: 32,
              height: 32,
              borderRadius: 20,
            }}
          />
          <View style={{paddingStart: 16}}>
            <Text
              style={{
                color: context.theme.balloonTextTertiary,
                fontSize: 14,
                lineHeight: 17,
                justifyContent: 'center',
              }}>
              {props.coinName}
            </Text>
            <Text
              style={{
                color: context.theme.balloonText,
                fontSize: 16,
                lineHeight: 24,
              }}>
              {`${props.avaxPrice} AVAX`}
            </Text>
            <Text
              style={{
                color: context.theme.balloonTextSecondary,
                fontSize: 14,
                lineHeight: 17,
              }}>
              {`$${props.coinPrice} USD`}
            </Text>
          </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <ButtonAvaTextual text={'Send'} onPress={() => {}} />
          <CarrotSVG color={context.theme.primaryColor} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const CoinListItem: FC<Props> = props => {
  return <BaseListItem {...props} />;
};

const ListItem = {
  Coin: CoinListItem,
};

export default ListItem;
