import React, {useContext} from 'react';
import {View} from 'react-native';
import AvaButton from 'components/AvaButton';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import AvaLogoSVG from 'components/svg/AvaLogoSVG';

interface DoneProps {
  onClose: () => void;
}

export default function DoneScreen({onClose}: DoneProps): JSX.Element {
  const context = useApplicationContext();
  return (
    <View
      style={[
        useApplicationContext().backgroundStyle,
        {
          backgroundColor: undefined,
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          paddingStart: 0,
          paddingEnd: 0,
        },
      ]}>
      <Space y={100} />
      <AvaLogoSVG
        logoColor={context.theme.white}
        backgroundColor={context.theme.logoColor}
      />
      <Space y={32} />
      <AvaText.Heading2>Asset sent</AvaText.Heading2>
      <View style={{flex: 1}} />
      <View style={{width: '100%'}}>
        <AvaButton.PrimaryLarge style={{margin: 16}} onPress={onClose}>
          Done
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  );
}
