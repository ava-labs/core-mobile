import React, {useContext, useState} from 'react';
import {Image, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import Divider from 'components/Divider';
import ButtonAva from 'components/ButtonAva';
import TextTitle from 'components/TextTitle';
import OvalTagBg from 'components/OvalTagBg';
import AvaText from 'components/AvaText';

type SendAvaxXProps = {
  tokenImageUrl: string;
  tokenAmount: string;
  fiatAmount: string;
  destinationAddress: string;
  memo?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function SendAvaxConfirm(
  props: SendAvaxXProps | Readonly<SendAvaxXProps>,
) {
  const context = useContext(ApplicationContext);
  const [backgroundStyle] = useState(context.backgroundStyle);

  return (
    <View
      style={[
        backgroundStyle,
        {
          alignItems: 'center',
          backgroundColor: context.theme.bgOnBgApp,
          paddingLeft: 0,
          paddingStart: 0,
          paddingEnd: 0,
          paddingRight: 0,
        },
      ]}>
      <Divider size={40} />
      <Image
        style={{width: 40, height: 40}}
        width={40}
        height={40}
        source={{uri: props.tokenImageUrl}}
      />
      <Divider size={16} />
      <TextTitle text={props.tokenAmount} size={24} bold />
      <Divider size={8} />
      <TextTitle text={props.fiatAmount} size={14} />

      <Divider size={32} />
      <OvalTagBg color={context.theme.bgApp}>
        <AvaText.Tag>Send to</AvaText.Tag>
      </OvalTagBg>
      <Divider size={32} />

      <View style={{paddingLeft: 24, paddingRight: 24}}>
        <AvaText.Heading2>{props.destinationAddress}</AvaText.Heading2>
      </View>

      <View style={{flex: 1}} />
      <View style={{width: '100%'}}>
        <ButtonAva text={'Send'} onPress={props.onConfirm} />
      </View>
    </View>
  );
}
