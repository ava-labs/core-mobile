import React, {FC} from 'react';
import {Dimensions, View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import QRCode from 'react-native-qrcode-svg';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import CircularText from 'components/svg/CircularText';
import BitcoinSVG from 'components/svg/BitcoinSVG';
import EthereumSvg from 'components/svg/Ethereum';

interface Props {
  address?: string;
  circularText?: string;
  sizePercentage?: number;
  token?: 'AVAX' | 'ETH' | 'BTC';
  circularTextColor?: string;
  circularTextBackgroundColor?: string;
}

const {width: screenWidth} = Dimensions.get('window');

const AvaxQRCode: FC<Props> = ({
  address,
  circularText = '',
  sizePercentage = 1,
  token = 'AVAX',
  circularTextBackgroundColor,
  circularTextColor,
}: Props) => {
  const theme = useApplicationContext().theme;
  const borderWidth = 16;

  const qrToken = () => {
    switch (token) {
      case 'BTC':
        return (
          <BitcoinSVG absolutePosition backgroundColor={'black'} size={40} />
        );
      case 'ETH':
        return <EthereumSvg absolutePosition size={40} />;
      default:
        return <AvaLogoSVG absolutePosition size={40} />;
    }
  };

  return (
    <View
      style={{
        borderWidth: borderWidth,
        height: screenWidth * sizePercentage,
        borderColor: theme.alternateBackground,
        borderRadius: 7,
      }}>
      <QRCode
        ecl={'H'}
        size={screenWidth * sizePercentage - 2 * borderWidth}
        value={address}
      />
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
        {qrToken()}
        <CircularText
          text={circularText}
          textColor={circularTextColor}
          circleBackgroundColor={circularTextBackgroundColor}
        />
      </View>
    </View>
  );
};

export default AvaxQRCode;
