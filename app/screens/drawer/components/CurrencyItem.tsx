import React, {FC, useContext, useState} from 'react';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import AppNavigation from 'navigation/AppNavigation';

const CurrencyItem: FC<Partial<DrawerContentComponentProps>> = ({
  navigation,
}) => {
  const theme = useContext(ApplicationContext).theme;
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const currency = () => (
    <AvaText.Body2 textStyle={{paddingRight: 12, color: theme.txtListItem}}>
      {selectedCurrency}
    </AvaText.Body2>
  );

  return (
    <>
      <AvaListItem.Base
        title={'Currency'}
        titleAlignment={'flex-start'}
        rightComponent={currency()}
        showNavigationArrow
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
