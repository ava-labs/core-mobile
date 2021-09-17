import React, {useContext} from 'react';
import {TouchableOpacity, TouchableWithoutFeedbackComponent, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import QRCode from 'react-native-qrcode-svg';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import CircularText from 'components/svg/CircularText';
import CopySVG from 'components/svg/CopySVG';
import Clipboard from '@react-native-clipboard/clipboard';

interface Props {
  chainName: string;
  description: string;
  address?: string;
}

function ChainCard({chainName, description, address}: Props) {
  const context = useContext(ApplicationContext);
  const shadow = context.shadow;
  return (
    <View>
      <View
        style={[
          {
            width: 280,
            borderRadius: 8,
            marginTop: 16,
            paddingVertical: 16,
            backgroundColor: context.theme.bgOnBgApp,
            marginHorizontal: 16,
            justifyContent: 'center',
            alignItems: 'center',
            alignSelf: 'baseline',
          },
          shadow,
        ]}>
        <View style={{paddingHorizontal: 50}}>
          <AvaText.Heading2>{chainName}</AvaText.Heading2>
          <AvaText.Body2
            textStyle={{
              paddingTop: 8,
              paddingBottom: 16,
              textAlign: 'justify',
            }}>
            {description}
          </AvaText.Body2>
          <View
            style={{
              borderWidth: 7,
              borderColor: context.theme.txtOnBgApp,
              borderRadius: 7,
              alignSelf: 'baseline',
            }}>
            <QRCode size={180} value={address} />
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
                logoColor={context.theme.txtListItem}
              />
              <CircularText text={chainName} />
            </View>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => {
          Clipboard.setString(address ?? '');
        }}
        style={[
          {
            width: 280,
            marginTop: 24,
            marginHorizontal: 16,
            padding: 16,
            marginRight: 32,
            backgroundColor: context.theme.bgOnBgApp,
            borderRadius: 8,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          },
          shadow,
        ]}>
        <CopySVG />
        <AvaText.Body1 textStyle={{flexWrap: 'wrap', paddingStart: 8}}>
          {address}
        </AvaText.Body1>
      </TouchableOpacity>
    </View>
  );
}

export default ChainCard;
