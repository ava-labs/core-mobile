import React, {useContext, useState} from 'react';
import {SafeAreaView} from 'react-native';
import Header from 'screens/mainView/Header';
import {ApplicationContext} from 'contexts/ApplicationContext';
import Divider from 'components/Divider';
import SendConfirmItem from 'screens/sendAvax/SendConfirmItem';
import ButtonAva from 'components/ButtonAva';

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
    <SafeAreaView style={backgroundStyle}>
      <Header showBack onBack={props.onClose} />
      <Divider size={12} />
      <SendConfirmItem.Amount
        image={props.tokenImageUrl}
        tokenAmount={props.tokenAmount}
        fiatAmount={props.fiatAmount}
      />
      <SendConfirmItem.Address address={props.destinationAddress} />
      {props.memo && <SendConfirmItem.Memo memo={props.memo} />}

      <ButtonAva text={'Confirm'} onPress={props.onConfirm} />
    </SafeAreaView>
  );
}
