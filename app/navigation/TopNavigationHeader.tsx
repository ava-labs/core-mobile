import React, {FC} from 'react';
import {View} from 'react-native';
import AvaButton from 'components/AvaButton';
import {DrawerActions, useNavigation} from '@react-navigation/native';
import MenuSVG from 'components/svg/MenuSVG';
import AppNavigation from 'navigation/AppNavigation';
import SwitchesSVG from 'components/svg/SwitchesSVG';
import HeaderAccountSelector from 'components/HeaderAccountSelector';

const TopNavigationHeader: FC = () => {
  const navigation = useNavigation();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: -10,
      }}>
      <AvaButton.Icon
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
        <MenuSVG />
      </AvaButton.Icon>
      <HeaderAccountSelector />
      <AvaButton.Icon
        style={{marginRight: 8}}
        onPress={() => navigation.navigate(AppNavigation.Wallet.SearchScreen)}>
        <SwitchesSVG />
      </AvaButton.Icon>
    </View>
  );
};

export default TopNavigationHeader;
