import React, {FC, useState} from 'react';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import AppNavigation from 'navigation/AppNavigation';

const CurrencyItem: FC<Partial<DrawerContentComponentProps>> = ({
  navigation,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const currency = () => (
    <AvaText.Body2 textStyle={{paddingRight: 12}}>
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
        disabled
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
