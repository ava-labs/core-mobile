import React, {useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import QRCode from 'react-native-qrcode-svg';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';
import CircularText from 'components/svg/CircularText';
import {Opacity05} from 'resources/Constants';
import {Space} from 'components/Space';

interface Props {
  chainName: string;
  description?: string;
  address?: string;
  hideBackground?: boolean;
  hideChainName?: boolean;
  removeMargins?: boolean;
}

function ChainCard({
  chainName,
  description,
  address,
  hideChainName,
  hideBackground,
  removeMargins,
}: Props) {
  const context = useContext(ApplicationContext);
  return (
    <View
      style={[
        {
          borderRadius: 8,
          marginTop: removeMargins ? 0 : 16,
          backgroundColor: hideBackground
            ? context.theme.transparent
            : context.theme.colorIcon1 + Opacity05,
          marginHorizontal: removeMargins ? 0 : 16,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'baseline',
        },
      ]}>
      <View style={{paddingHorizontal: 50}}>
        <Space y={16} />
        {hideChainName || <AvaText.Heading2>{chainName}</AvaText.Heading2>}
        {!!description && (
          <AvaText.Body2
            textStyle={{
              paddingTop: 8,
              paddingBottom: 16,
              textAlign: 'justify',
            }}>
            {description}
          </AvaText.Body2>
        )}
        <View
          style={{
            borderWidth: 7,
            height: 180,
            borderColor: context.theme.txtOnBgApp,
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
  );
}

export default ChainCard;
