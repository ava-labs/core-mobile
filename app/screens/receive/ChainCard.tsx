import React, {useContext} from 'react';
import {View} from 'react-native';
import {ApplicationContext} from 'contexts/ApplicationContext';
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
  const context = useContext(ApplicationContext);
  return (
    <View
      style={[
        {
          width: 280,
          height: 292,
          borderRadius: 8,
          marginTop: 16,
          backgroundColor: context.theme.colorIcon1 + Opacity05,
          marginHorizontal: 16,
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'baseline',
        },
      ]}>
      <View style={{paddingHorizontal: 50}}>
        <Space y={16} />
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
