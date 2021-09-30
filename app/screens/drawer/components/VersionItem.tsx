import React from 'react';
import {Alert} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import AvaText from 'components/AvaText';

export default function VersionItem() {
  return (
    <>
      <AvaListItem.Custom
        title={'Version'}
        leftComponent={null}
        rightComponent={<AvaText.Body2>0.0.0</AvaText.Body2>}
        onPress={() => {
          Alert.alert('naviagate to security');
        }}
      />
    </>
  );
}
