import React, {useContext} from 'react';
import {ToastAndroid, View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import AvaButton from 'components/AvaButton';
import {Space} from 'components/Space';
import OvalTagBg from 'components/OvalTagBg';
import FlexSpacer from 'components/FlexSpacer';
import CopySVG from 'components/svg/CopySVG';
import Clipboard from '@react-native-clipboard/clipboard';

type Props = {
  title: string;
  address: string;
  color: string;
};

const copyToClipboard = (str: string): void => {
  Clipboard.setString(str);
  ToastAndroid.show('Copied', 1000);
};

function AccountChainAddress({title, address, color}: Props): JSX.Element {
  const context = useContext(ApplicationContext);

  return (
    <View style={{flexDirection: 'row'}}>
      <OvalTagBg
        color={color}
        style={{
          flex: 1,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <AvaText.Heading3>{title}</AvaText.Heading3>
        <FlexSpacer />
        <AvaText.Heading3>{address}</AvaText.Heading3>
        <Space y={16} />
        <AvaButton.Base onPress={() => copyToClipboard(address)}>
          <CopySVG color={context.theme.txtOnBgApp} />
        </AvaButton.Base>
      </OvalTagBg>
    </View>
  );
}

export default AccountChainAddress;
