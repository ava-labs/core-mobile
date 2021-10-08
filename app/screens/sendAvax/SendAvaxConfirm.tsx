import React, {useContext, useEffect, useState} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import OvalTagBg from 'components/OvalTagBg';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {Opacity50} from 'resources/Constants';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {SendAvaxContext} from 'contexts/SendAvaxContext';
import {SelectedTokenContext} from 'contexts/SelectedTokenContext';

type SendAvaxXProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export default function SendAvaxConfirm(
  props: SendAvaxXProps | Readonly<SendAvaxXProps>,
): JSX.Element {
  const context = useContext(ApplicationContext);
  const [backgroundStyle] = useState(context.backgroundStyle);
  const {navigate} = useNavigation();
  const {
    destinationAddress,
    sendAmountString,
    onSendAvax,
    createdTxId,
    sendFeeString,
  } = useContext(SendAvaxContext);
  const {selectedToken, tokenLogo} = useContext(SelectedTokenContext);

  useEffect(() => {
    if (createdTxId) {
      navigate(AppNavigation.SendToken.DoneScreen);
    }
  }, [createdTxId]);

  return (
    <View
      style={[
        backgroundStyle,
        {
          alignItems: 'center',
          backgroundColor: undefined, //cancel backgroundColor from backgroundStyle
          paddingLeft: 0,
          paddingStart: 0,
          paddingEnd: 0,
          paddingRight: 0,
        },
      ]}>
      <Space y={40} />
      {tokenLogo()}
      <Space y={16} />
      <AvaText.Heading1>
        {sendAmountString + ' ' + selectedToken?.symbol}
      </AvaText.Heading1>
      <Space y={8} />
      {/*<AvaText.Body2>{route?.params?.fiatAmount}</AvaText.Body2>*/}

      <Space y={32} />
      <OvalTagBg color={context.theme.colorBg3 + Opacity50}>
        <AvaText.Tag>Send to</AvaText.Tag>
      </OvalTagBg>
      <Space y={32} />

      <View style={{paddingLeft: 24, paddingRight: 24}}>
        <AvaText.Heading2>{destinationAddress}</AvaText.Heading2>
      </View>

      <View style={{flex: 1}} />
      <View style={{alignSelf: 'flex-start', marginLeft: 16}}>
        <AvaText.Body3
          textStyle={{
            textAlign: 'right',
            color: context.theme.txtListItemSubscript,
          }}>
          {'Fee: ' + sendFeeString}
        </AvaText.Body3>
      </View>
      <View style={{width: '100%'}}>
        <AvaButton.PrimaryLarge
          style={{margin: 16}}
          onPress={() => onSendAvax()}>
          Send
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  );
}
