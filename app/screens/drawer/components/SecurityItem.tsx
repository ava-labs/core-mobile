import React from 'react';
import AvaListItem from 'components/AvaListItem';
import CarrotSVG from 'components/svg/CarrotSVG';
import AppNavigation from 'navigation/AppNavigation';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigatorProps} from 'react-native-screens/lib/typescript/native-stack/types';

const SecurityItem = () => {
  const navigation = useNavigation<NativeStackNavigatorProps>();

  return (
    <AvaListItem.Base
      title={'Security & Privacy'}
      leftComponent={null}
      rightComponent={<CarrotSVG />}
      onPress={() => {
        navigation?.navigate(AppNavigation.Wallet.SecurityPrivacy);
      }}
    />
  );
};

export default SecurityItem;
