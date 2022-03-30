import React from 'react';
import {StyleSheet, View} from 'react-native';
import AvaButton from 'components/AvaButton';
import AvaText from 'components/AvaText';
import {useApplicationContext} from 'contexts/ApplicationContext';
import FlexSpacer from 'components/FlexSpacer';

export type FeatureBlockedProps = {
  onOk: () => void;
};
export default function FeatureBlocked({
  onOk,
}: FeatureBlockedProps): JSX.Element {
  const {theme} = useApplicationContext();

  return (
    <View style={[styles.background, {backgroundColor: theme.overlay}]}>
      <FlexSpacer />
      <AvaText.Heading1
        textStyle={{
          textAlign: 'center',
          alignSelf: 'center',
        }}>
        Feature blocked!
      </AvaText.Heading1>
      <FlexSpacer />
      <AvaButton.PrimaryLarge style={{margin: 18}} onPress={onOk}>
        OK
      </AvaButton.PrimaryLarge>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});
