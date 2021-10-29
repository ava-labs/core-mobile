import React, {FC, useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import QRCode from 'react-native-qrcode-svg';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import CircularText from 'components/svg/CircularText';

interface Props {
  address?: string;
  circularText?: string;
}

const AvaxQRCode: FC<Props> = ({address = '', circularText = ''}: Props) => {
  const theme = useContext(ApplicationContext).theme;

  return (
    <View
      style={{
        borderWidth: 7,
        height: 180,
        borderColor: theme.txtOnBgApp,
        borderRadius: 7,
        alignSelf: 'baseline',
      }}>
      <QRCode ecl={'H'} size={168} value={address ? address : undefined} />
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <AvaLogoSVG absolutePosition size={40} logoColor={theme.txtListItem} />
        <CircularText text={circularText} />
      </View>
    </View>
  );
};

export default AvaxQRCode;
