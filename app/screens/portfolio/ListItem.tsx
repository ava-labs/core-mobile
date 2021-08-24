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
  const isDarkMode = context.isDarkMode;

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
                color: '#949497',
                fontSize: 14,
                lineHeight: 17,
                justifyContent: 'center',
              }}>
              {props.coinName}
            </Text>
            <Text
              style={{
                color: isDarkMode ? '#F8F8FB' : '#1A1A1C',
                fontSize: 16,
                lineHeight: 24,
              }}>
              {`${props.avaxPrice} AVAX`}
            </Text>
            <Text style={{color: '#B4B4B7', fontSize: 14, lineHeight: 17}}>
              {`$${props.coinPrice} USD`}
            </Text>
          </View>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <ButtonAvaTextual
            text={'Send'}
            onPress={() => {}}
            color={'#F1595A'}
          />
          <CarrotSVG color={'#F1595A'} />
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
