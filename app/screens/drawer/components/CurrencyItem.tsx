import React, {FC, useContext, useState} from 'react';
import {View} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import CarrotSVG from 'components/svg/CarrotSVG';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import AppNavigation from 'navigation/AppNavigation';

const CurrencyItem: FC<Partial<DrawerContentComponentProps>> = ({
  navigation,
}) => {
  const theme = useContext(ApplicationContext).theme;
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const customNav = () => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flex: 1,
      }}>
      <AvaText.Body2 textStyle={{paddingRight: 12, color: theme.txtListItem}}>
        {selectedCurrency}
      </AvaText.Body2>
      <CarrotSVG />
    </View>
  );

  return (
    <>
      <AvaListItem.Base
        title={'Currency'}
        titleAlignment={'flex-start'}
        rightComponent={customNav()}
        onPress={() => {
          navigation?.navigate(AppNavigation.Wallet.CurrencySelector, {
            onCurrencySelected: setSelectedCurrency,
            selectedCurrency,
          });
        }}
      />
    </>
  );
};

export default CurrencyItem;
