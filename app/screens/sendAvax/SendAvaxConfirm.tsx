import React, {useContext, useEffect, useState} from 'react';
import {Image, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import {Space} from 'components/Space';
import OvalTagBg from 'components/OvalTagBg';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {Opacity50} from 'resources/Constants';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {SendTokenStackProps} from 'navigation/SendTokenStackScreen';
import AppNavigation from 'navigation/AppNavigation';
import {SendAvaxContext} from 'contexts/SendAvaxContext';

type SendAvaxXProps = {
  onClose: () => void;
  onConfirm: () => void;
};
type SendAvaxConfirmProps = RouteProp<
  SendTokenStackProps,
  'sendAvaxConfirmProps'
>;

export default function SendAvaxConfirm(
  props: SendAvaxXProps | Readonly<SendAvaxXProps>,
): JSX.Element {
  const context = useContext(ApplicationContext);
  const [backgroundStyle] = useState(context.backgroundStyle);
  const {navigate} = useNavigation();
  const {destinationAddress, sendAmountString, onSendAvax, createdTxId} =
    useContext(SendAvaxContext);
  const route = useRoute<SendAvaxConfirmProps>();

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
      <Image
        style={{width: 40, height: 40}}
        width={40}
        height={40}
        source={{uri: route?.params?.tokenImageUrl}}
      />
      <Space y={16} />
      <AvaText.Heading1>{sendAmountString}</AvaText.Heading1>
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
