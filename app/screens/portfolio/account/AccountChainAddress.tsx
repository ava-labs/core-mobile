import React, {useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import Divider from 'components/Divider';
import OvalTagBg from 'components/OvalTagBg';
import FlexSpacer from 'components/FlexSpacer';
import CopySVG from 'components/svg/CopySVG';

type Props = {
  title: string;
  address: string;
  color: string;
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
        <Divider size={16} />
        <CopySVG color={context.theme.txtOnBgApp} />
      </OvalTagBg>
    </View>
  );
}

export default AccountChainAddress;
