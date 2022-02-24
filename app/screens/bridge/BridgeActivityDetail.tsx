import React, {FC, useContext} from 'react';
import {View} from 'react-native';
import {
  ApplicationContext,
  useApplicationContext,
} from 'contexts/ApplicationContext';
import {RouteProp, useRoute} from '@react-navigation/native';
import {BridgeStackParamList} from 'navigation/wallet/BridgeScreenStack';
import AvaText from 'components/AvaText';

interface Props {}

const BridgeActivityDetail: FC<Props> = props => {
  const {theme} = useApplicationContext();
  const {params} = useRoute<RouteProp<BridgeStackParamList>>();
  console.log('blockchain: ' + params?.blockchain);
  console.log('resultHash: ' + params?.resultHash);

  return (
    <View>
      <AvaText.Heading3>{params?.blockchain}</AvaText.Heading3>
      <AvaText.Heading3>{params?.resultHash}</AvaText.Heading3>
    </View>
  );
};

export default BridgeActivityDetail;
