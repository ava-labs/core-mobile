import React from 'react';
import {StyleSheet, View} from 'react-native';
import AvaButton from 'components/AvaButton';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {SwapStackParamList} from 'navigation/wallet/SwapScreenStack';
import {useApplicationContext} from 'contexts/ApplicationContext';
import PersonageWithLantern from 'components/images/PersonageWithLantern';

export default function FailScreen(): JSX.Element {
  const {navigate} = useNavigation<StackNavigationProp<SwapStackParamList>>();
  const {theme} = useApplicationContext();
  const errorMsg = useRoute<RouteProp<SwapStackParamList>>()?.params?.errorMsg;

  function onClose() {
    navigate(AppNavigation.Swap.Swap);
  }

  return (
    <View style={{flex: 1}}>
      <View style={styles.background}>
        <PersonageWithLantern />
      </View>
      <View style={styles.container}>
        <AvaText.Heading1
          textStyle={{
            textAlign: 'center',
            alignSelf: 'center',
          }}>
          Swap failed!
        </AvaText.Heading1>
        <Space y={10} />
        <AvaText.Body1
          color={theme.colorError}
          textStyle={{
            textAlign: 'center',
            alignSelf: 'center',
          }}>
          {errorMsg}
        </AvaText.Body1>
        <Space y={100} />
        <AvaButton.PrimaryLarge style={{margin: 18}} onPress={onClose}>
          OK
        </AvaButton.PrimaryLarge>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    bottom: 0,
    left: -10,
    right: 0,
    zIndex: 0,
    elevation: 0,
  },
  container: {flex: 1, justifyContent: 'flex-end'},
});
