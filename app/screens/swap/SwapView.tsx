import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {useApplicationContext} from 'contexts/ApplicationContext';
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG';
import AvaButton from 'components/AvaButton';
import TokenDropDown from 'screens/swap/components/TokenDropDown';
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails';
import {TokenWithBalance} from '@avalabs/wallet-react-components';

export default function SwapView() {
  const {theme} = useApplicationContext();

  function setFrom(token: TokenWithBalance) {}

  function setTo(token: TokenWithBalance) {}

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Space y={8} />
        <AvaText.Heading1 textStyle={{marginHorizontal: 16}}>
          Swap
        </AvaText.Heading1>
        <Space y={20} />
        <TokenDropDown label={'From'} onTokenSelected={setFrom} />
        <Space y={20} />
        <AvaButton.Base
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
        <TokenDropDown label={'To'} onTokenSelected={setTo} />
        <SwapTransactionDetail />
      </ScrollView>
      <AvaButton.PrimaryLarge style={{margin: 16}}>
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
