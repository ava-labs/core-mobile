import React, {FC, RefObject, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, TextInput, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import AvaText from 'components/AvaText';
import {useNavigation} from '@react-navigation/native';
import DotSVG from 'components/svg/DotSVG';
import Separator from 'components/Separator';
import {Row} from 'components/Row';
import AvaButton from 'components/AvaButton';
import {Opacity10, Opacity50} from 'resources/Constants';
import FlexSpacer from 'components/FlexSpacer';
import NetworkFeeSelector from 'components/NetworkFeeSelector';
import {useSendTokenContext} from 'contexts/SendTokenContext';
import InputText from 'components/InputText';

export default function ReviewSend({
  onSuccess,
}: {
  onSuccess: (transactionId: string) => void;
}) {
  const {theme, isDarkMode} = useApplicationContext();
  const {goBack} = useNavigation();
  const {
    tokenLogo,
    sendAmount,
    fromAccount,
    toAccount,
    sendFeeAvax,
    sendFeeUsd,
    gasPresets,
    setSendGasPrice,
    onSendNow,
    sendStatus,
    transactionId,
  } = useSendTokenContext();

  const [selectedFeeSelector, setSelectedFeeSelector] = useState('Normal');
  const [customGasPrice, setCustomGasPrice] = useState('');

  useEffect(() => {
    switch (sendStatus) {
      case 'Success':
        if (transactionId) {
          onSuccess(transactionId);
        }
    }
  }, [sendStatus, transactionId]);

  return (
    <View style={{flex: 1}}>
      <AvaText.Heading1 textStyle={{marginHorizontal: 16}}>
        Send
      </AvaText.Heading1>
      <View
        style={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: -36,
          zIndex: 2,
        }}>
        <View style={{position: 'absolute'}}>
          <DotSVG fillColor={theme.colorBg1} size={72} />
        </View>
        {tokenLogo()}
      </View>
      <View
        style={{
          backgroundColor: theme.colorBg2,
          paddingTop: 48,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flex: 1,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}>
        <AvaText.Body2 textStyle={{textAlign: 'center'}}>Amount</AvaText.Body2>
        <Space y={4} />
        <Row style={{justifyContent: 'center'}}>
          <AvaText.Heading1>{sendAmount}</AvaText.Heading1>
          <Space x={4} />
          <AvaText.Heading3>AVAX</AvaText.Heading3>
        </Row>
        <Space y={8} />
        <SendRow
          label={'From'}
          title={fromAccount.title}
          address={fromAccount.address}
        />
        <SendRow
          label={'To'}
          title={toAccount.title}
          address={toAccount.address}
        />
        <Space y={16} />
        <Row style={{alignItems: 'baseline'}}>
          <AvaText.Heading3>≈ ${sendFeeUsd?.toFixed(4)}</AvaText.Heading3>
          <Space x={4} />
          <AvaText.Body3 textStyle={{paddingBottom: 2}}>
            {sendFeeAvax
              ? Number.parseFloat(sendFeeAvax).toFixed(6).toString()
              : '-'}{' '}
            AVAX
          </AvaText.Body3>
        </Row>
        <Space y={8} />
        <NetworkFeeSelector
          networkFeeAvax={netFeeString}
          networkFeeUsd={`${fees.sendFeeUsd?.toFixed(4)} USD`}
          onSelectedPreset={preset => fees.setSelectedGasPricePreset(preset)}
          onGasPriceEntered={gasPrice =>
            fees.setCustomGasPriceNanoAvax(gasPrice)
          }
          onSettings={() => {
            navigate(AppNavigation.Send.EditGasLimit, {
              currentNetFee: netFeeString,
              currentGasLimit: fees.gasLimit?.toString() ?? '',
              onSave: customGasLimit => {
                if (Number(customGasLimit)) {
                  fees.setGasLimit(Number(customGasLimit));
                }
              },
            });
          }}
        />
        <Space y={16} />
        <Separator />
        <Space y={32} />
        <Row style={{justifyContent: 'space-between'}}>
          <AvaText.Body2>Balance After Transaction</AvaText.Body2>
          <AvaText.Heading2>
            {fromAccount.balanceAfterTrx} AVAX
          </AvaText.Heading2>
        </Row>
        <AvaText.Body3 textStyle={{alignSelf: 'flex-end'}}>
          ${fromAccount.balanceAfterTrxUsd} USD
        </AvaText.Body3>
        <FlexSpacer />
        {sendStatus === 'Idle' && (
          <>
            <AvaButton.PrimaryLarge onPress={onSendNow}>
              Send Now
            </AvaButton.PrimaryLarge>
            <Space y={16} />
            <AvaButton.PrimaryLarge
              onPress={() => goBack()}
              style={{
                backgroundColor: isDarkMode
                  ? theme.white + Opacity10
                  : theme.colorBg1 + Opacity10,
              }}>
              Cancel
            </AvaButton.PrimaryLarge>
          </>
        )}
        {sendStatus === 'Sending' && (
          <>
            <ActivityIndicator size="large" color={theme.colorPrimary1} />
            <Space y={32} />
          </>
        )}
      </View>
    </View>
  );
}

function SendRow({
  label,
  title,
  address,
}: {
  label: string;
  title: string;
  address: string;
}) {
  return (
    <>
      <Space y={8} />
      <AvaText.Body2>{label}</AvaText.Body2>
      <Row style={{justifyContent: 'space-between'}}>
        <AvaText.Heading3>{title}</AvaText.Heading3>
        <AvaText.Body1 ellipsizeMode={'middle'} textStyle={{width: 152}}>
          {address}
        </AvaText.Body1>
      </Row>
      <Space y={4} />
      <Separator />
    </>
  );
}
