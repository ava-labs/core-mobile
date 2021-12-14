import React, {FC} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import InputText from 'components/InputText';
import {useApplicationContext} from 'contexts/ApplicationContext';
import FlexSpacer from 'components/FlexSpacer';
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG';
import AvaButton from 'components/AvaButton';
import CarrotSVG from 'components/svg/CarrotSVG';

export default function SwapView() {
  const {theme} = useApplicationContext();
  return (
    <View style={{flex: 1}}>
      <ScrollView style={[styles.container]}>
        <Space y={8} />
        <AvaText.Heading1 textStyle={{marginHorizontal: 16}}>
          Swap
        </AvaText.Heading1>
        <Space y={20} />
        <TokenDropDown />
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
        <TokenDropDown />
        <SwapTransactionDetail />
      </ScrollView>
      <AvaButton.PrimaryLarge style={{margin: 16}}>
        Review Order
      </AvaButton.PrimaryLarge>
    </View>
  );
}

interface SwapTransactionDetailProps {}

const SwapTransactionDetail: FC<SwapTransactionDetailProps> = props => {
  const context = useApplicationContext();

  return (
    <View style={{flex: 1, paddingHorizontal: 16}}>
      <Space y={16} />
      <AvaText.Heading3>Transaction details</AvaText.Heading3>
      <Space y={16} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <AvaText.Body2>Rate</AvaText.Body2>
        <AvaText.Heading3>1 AVAX ≈ 45.5589 PNG</AvaText.Heading3>
      </View>
      <Space y={16} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <AvaText.Body2>Slippage tolerance</AvaText.Body2>
        <View style={{backgroundColor: context.theme.colorBg2}}>
        <InputText text={'0.12%'} keyboardType={'numeric'} />
        </View>
      </View>
      <Space y={16} />
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <AvaText.Body2>Network fee</AvaText.Body2>
          <AvaText.Heading3>0.21223 AVAX</AvaText.Heading3>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <AvaText.Body3 color={context.theme.colorPrimary1}>
            Edit
          </AvaText.Body3>
          <AvaText.Body2>$0.24 USD</AvaText.Body2>
        </View>
      </View>
      <Space y={16} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <AvaText.Body2>Avalanche wallet fee</AvaText.Body2>
        <AvaText.Heading3>0.21223 AVAX</AvaText.Heading3>
      </View>
    </View>
  );
};

interface TokenDropDownProps {}

const TokenDropDown: FC<TokenDropDownProps> = props => {
  const context = useApplicationContext();
  return (
    <View style={{marginHorizontal: 16, flex: 1}}>
      <AvaText.Heading3>From</AvaText.Heading3>
      <Space y={4} />
      <View
        style={[
          {
            flex: 1,
            flexDirection: 'row',
            paddingStart: 16,
            paddingEnd: 8,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: context.theme.colorBg2,
            borderRadius: 10,
            maxHeight: 70,
          },
          context.shadow,
        ]}>
        <AvaButton.Base style={{flexDirection: 'row'}}>
          <AvaText.Heading3>Select</AvaText.Heading3>
          <Space x={8} />
          <CarrotSVG
            direction={'down'}
            size={12}
            color={context.theme.colorText1}
          />
        </AvaButton.Base>
        <FlexSpacer />
        <InputText
          placeholder="Enter the amount"
          keyboardType="numeric"
          onChangeText={text => {
            console.log('amount: ' + text);
          }}
        />
      </View>
      <Space y={8} />
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <AvaText.Body3 color={context.theme.colorError}>Error</AvaText.Body3>
        <AvaText.Body3>$0.00 USD</AvaText.Body3>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
