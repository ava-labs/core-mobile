import React, {FC} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {View} from 'react-native';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import InputText from 'components/InputText';
import AppNavigation from 'navigation/AppNavigation';
import {useNavigation} from '@react-navigation/native';
import AvaButton from 'components/AvaButton';

interface SwapTransactionDetailProps {}

const SwapTransactionDetail: FC<SwapTransactionDetailProps> = props => {
  const context = useApplicationContext();
  const navigation = useNavigation();

  function openTransactionFees() {
    navigation.navigate(AppNavigation.Modal.SwapTransactionFee);
  }

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
          <AvaButton.Base onPress={openTransactionFees}>
            <AvaText.Body3 color={context.theme.colorPrimary1}>
              Edit
            </AvaText.Body3>
          </AvaButton.Base>
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

export default SwapTransactionDetail;
