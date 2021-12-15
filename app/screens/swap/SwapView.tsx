import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {useApplicationContext} from 'contexts/ApplicationContext';
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG';
import AvaButton from 'components/AvaButton';
import TokenDropDown from 'screens/swap/components/TokenDropDown';
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails';
import {useSwapContext} from 'contexts/SwapContext';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';

export default function SwapView() {
  const {theme} = useApplicationContext();
  const {swapFromTo, swapFrom, swapTo} = useSwapContext();
  const navigation = useNavigation();

  const reviewButtonDisabled = swapTo.amount === 0 || swapFrom.amount === 0;

  function confirm() {
    navigation.navigate(AppNavigation.Wallet.SwapReview);
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Space y={8} />
        <AvaText.Heading1 textStyle={{marginHorizontal: 16}}>
          Swap
        </AvaText.Heading1>
        <Space y={20} />
        <TokenDropDown type={'From'} />
        <Space y={20} />
        <AvaButton.Base
          onPress={swapFromTo}
          style={{
            alignSelf: 'flex-end',
            borderRadius: 50,
            backgroundColor: theme.listItemBg,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 16,
          }}>
          <SwapNarrowSVG />
        </AvaButton.Base>
        <TokenDropDown type={'To'} />
        <SwapTransactionDetail />
      </ScrollView>
      <AvaButton.PrimaryLarge
        style={{margin: 16}}
        onPress={confirm}
        disabled={reviewButtonDisabled}>
        Review Order
      </AvaButton.PrimaryLarge>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
