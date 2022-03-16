import React from 'react';
import {Alert} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';

const pkg = require('../../../package.json');

export default function VersionItem() {
  return (
    <AvaListItem.Base
      title={'Version'}
      titleAlignment={'flex-start'}
      leftComponent={null}
      rightComponent={<AvaText.Body2>{pkg.version}</AvaText.Body2>}
      rightComponentVerticalAlignment={'center'}
      onPress={() => {
        Alert.alert('naviagate to security');
      }}
    />
  );
}
