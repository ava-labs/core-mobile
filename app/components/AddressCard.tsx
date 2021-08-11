import React, {useContext} from 'react';
import {Share, StyleSheet, View} from 'react-native';
import TextTitle from 'components/TextTitle';
import QRCode from 'react-native-qrcode-svg';
import ButtonAva from 'components/ButtonAva';
import {ApplicationContext} from 'contexts/ApplicationContext';

type Props = {
  title: string;
  address: string;
};

export default function AddressCard(props: Props | Readonly<Props>) {
  const context = useContext(ApplicationContext);

  const onShare = (address: string): void => {
    Share.share(
      {
        title: 'title',
        message: address,
      },
      {
        dialogTitle: 'dialog Title',
      },
    ).then(value => console.log(value));
  };

  const theme = context.theme;
  const qr = props.address ? <QRCode value={props.address} /> : undefined;

  return (
    <View
      style={[
        {
          backgroundColor: theme.bgLight,
          flex: 1,
          height: 100,
        },
      ]}>
      <View style={[{margin: 10}]}>
        <TextTitle text={props.title} size={18} />
      </View>
      <View style={styles.horizontalLayout}>
        <View style={[{margin: 10}]}>{qr}</View>
        <View style={[{margin: 10, flexShrink: 1}]}>
          <TextTitle text={props.address} size={18} />
        </View>
      </View>
      <ButtonAva text={'Share'} onPress={() => onShare(props.address)} />
    </View>
  );
}

const styles = StyleSheet.create({
  horizontalLayout: {
    flexDirection: 'row',
  },
});
