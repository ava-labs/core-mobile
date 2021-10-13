import React, {FC} from 'react';
import AvaListItem from 'components/AvaListItem';
import CarrotSVG from 'components/svg/CarrotSVG';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import AppNavigation from 'navigation/AppNavigation';

const LegalItem: FC<Partial<DrawerContentComponentProps>> = ({navigation}) => {
  return (
    <>
      <AvaListItem.Base
        title={'Legal'}
        leftComponent={null}
        rightComponent={<CarrotSVG />}
        onPress={() => {
          navigation?.navigate(AppNavigation.Wallet.WebView);
        }}
      />
    </>
  );
};

export default LegalItem;
