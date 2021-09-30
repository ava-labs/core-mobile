import React from 'react';
import {Alert} from 'react-native';
import AvaListItem from 'components/AvaListItem';
import CarrotSVG from 'components/svg/CarrotSVG';

export default function LegalItem() {
  return (
    <>
      <AvaListItem.Custom
        title={'Legal'}
        leftComponent={null}
        rightComponent={<CarrotSVG />}
        onPress={() => {
          Alert.alert('naviagate to legal');
        }}
      />
    </>
  );
}
