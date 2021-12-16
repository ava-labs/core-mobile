import React, {FC} from 'react';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {View} from 'react-native';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import InputText from 'components/InputText';
import AppNavigation from 'navigation/AppNavigation';
import {useNavigation} from '@react-navigation/native';
import AvaButton from 'components/AvaButton';
import {useSwapContext} from 'contexts/SwapContext';
import {Popable} from 'react-native-popable';

interface SwapTransactionDetailProps {
  review?: boolean;
}

const SwapTransactionDetail: FC<SwapTransactionDetailProps> = ({
  review = false,
}) => {
  const context = useApplicationContext();
  const navigation = useNavigation();
  const {trxDetails} = useSwapContext();

  function openTransactionFees() {
    navigation.navigate(AppNavigation.Modal.SwapTransactionFee);
  }

  return (
    <View style={{flex: 1, paddingHorizontal: 16}}>
      {review || (
        <>
          <Space y={16} />
          <AvaText.Heading3>Transaction details</AvaText.Heading3>
          <Space y={16} />
        </>
      )}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <AvaText.Body2>Rate</AvaText.Body2>
        <AvaText.Heading3>{trxDetails.rate}</AvaText.Heading3>
      </View>
      <Space y={16} />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Popable
          content={'Some description about slippage tolerance'}
          position={'right'}>
          <AvaText.Body2>Slippage tolerance ⓘ</AvaText.Body2>
        </Popable>
        {review ? (
          <AvaText.Heading3>{trxDetails.slippageTol}</AvaText.Heading3>
        ) : (
          <InputText
            text={`${trxDetails.slippageTol}`}
            keyboardType={'numeric'}
          />
        )}
      </View>
      <Space y={16} />
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <Popable
            content={'Some description about network fee'}
            position={'right'}>
            <AvaText.Body2>Network fee ⓘ</AvaText.Body2>
          </Popable>
          <AvaText.Heading3>{trxDetails.networkFee}</AvaText.Heading3>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <AvaButton.Base onPress={openTransactionFees}>
            <AvaText.Body3 color={context.theme.colorPrimary1}>
              Edit
            </AvaText.Body3>
          </AvaButton.Base>
          <AvaText.Body2>{trxDetails.networkFeeUsd}</AvaText.Body2>
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
        <AvaText.Heading3>{trxDetails.avaxWalletFee}</AvaText.Heading3>
      </View>
    </View>
  );
};

export default SwapTransactionDetail;
