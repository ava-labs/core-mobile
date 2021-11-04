import React from 'react';
import {View} from 'react-native';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {Space} from 'components/Space';
import OvalTagBg from 'components/OvalTagBg';
import FlexSpacer from 'components/FlexSpacer';
import CopySVG from 'components/svg/CopySVG';
import Clipboard from '@react-native-clipboard/clipboard';
import {ShowSnackBar} from 'components/Snackbar';

type Props = {
  title: string;
  address: string;
  color: string;
  bgColor: string;
};

const copyToClipboard = (str: string): void => {
  Clipboard.setString(str);
  ShowSnackBar('Copied');
};

function AccountChainAddress({
  title,
  address,
  color,
  bgColor,
}: Props): JSX.Element {
  return (
    <View style={{flexDirection: 'row'}}>
      <OvalTagBg
        color={bgColor}
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <AvaText.Heading3 textStyle={{color: color}}>{title}</AvaText.Heading3>
        <FlexSpacer />
        <AvaText.Body1 textStyle={{color: color, flex: 1}} ellipsize={'middle'}>
          {address}
        </AvaText.Body1>
        <Space x={16} />
        <AvaButton.Base onPress={() => copyToClipboard(address)}>
          <CopySVG color={color} />
        </AvaButton.Base>
      </OvalTagBg>
    </View>
  );
}

export default AccountChainAddress;
