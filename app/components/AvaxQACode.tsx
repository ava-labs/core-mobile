import React, {FC} from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import QRCode from 'react-native-qrcode-svg';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import CircularText from 'components/svg/CircularText';

interface Props {
  address?: string;
  circularText?: string;
  sizePercentage?: number;
}

const AvaxQRCode: FC<Props> = ({
  address,
  circularText = '',
  sizePercentage = 1,
}: Props) => {
  const theme = useApplicationContext().theme;

  return (
    <View
      style={{
        borderWidth: 7 * sizePercentage,
        height: 180 * sizePercentage,
        borderColor: theme.txtOnBgApp,
        borderRadius: 7,
        alignSelf: 'baseline',
      }}>
      <QRCode ecl={'H'} size={168 * sizePercentage} value={address} />
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
        <AvaLogoSVG
          absolutePosition
          size={40}
          logoColor={theme.txtListItem}
          backgroundColor={theme.colorBg3}
        />
        <CircularText text={circularText} />
      </View>
    </View>
  );
};

export default AvaxQRCode;
