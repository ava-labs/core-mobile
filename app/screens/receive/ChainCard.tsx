import React from 'react';
import {View} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaText from 'components/AvaText';
import {Opacity05} from 'resources/Constants';
import {Space} from 'components/Space';
import AvaxQACode from 'components/AvaxQACode';

interface Props {
  chainName: string;
  description: string;
  address?: string;
}

function ChainCard({chainName, description, address}: Props) {
  const {theme, isDarkMode} = useApplicationContext();
  return (
    <View
      style={[
        {
          width: 280,
          height: 292,
          borderRadius: 8,
          marginTop: 16,
          borderColor: theme.colorIcon1 + Opacity05,
          borderWidth: 1,
          marginStart: 16,
          paddingBottom: 8,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'baseline',
        },
        isDarkMode && {
          backgroundColor: theme.colorIcon1 + Opacity05,
          borderWidth: 0,
        },
      ]}>
      <View style={{paddingHorizontal: 50}}>
        <Space y={8} />
        <AvaText.Heading2>{chainName}</AvaText.Heading2>
        <AvaText.Body2
          textStyle={{
            paddingTop: 8,
            paddingBottom: 16,
            textAlign: 'justify',
          }}>
          {description}
        </AvaText.Body2>
        <AvaxQACode address={address} circularText={chainName} />
      </View>
    </View>
  );
}

export default ChainCard;
