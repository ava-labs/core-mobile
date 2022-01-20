import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import AvaText from 'components/AvaText';
import {Space} from 'components/Space';
import {useApplicationContext} from 'contexts/ApplicationContext';
import SwapNarrowSVG from 'components/svg/SwapNarrowSVG';
import AvaButton from 'components/AvaButton';
import TokenDropDown from 'screens/swap/components/TokenDropDown';
import SwapTransactionDetail from 'screens/swap/components/SwapTransactionDetails';
import {useSwapContext} from 'contexts/SwapContext';
import {useNavigation} from '@react-navigation/native';
import AppNavigation from 'navigation/AppNavigation';
import {StackNavigationProp} from '@react-navigation/stack';
import {SwapStackParamList} from 'navigation/wallet/SwapScreenStack';
import {
  FUJI_NETWORK,
  useNetworkContext,
} from '@avalabs/wallet-react-components';
import ZeroState from 'components/ZeroState';

export default function SwapView() {
  const {theme} = useApplicationContext();
  const {swapFromTo, swapFrom, swapTo, error} = useSwapContext();
  const networkContext = useNetworkContext();
  const navigation = useNavigation<StackNavigationProp<SwapStackParamList>>();

  const reviewButtonDisabled = !swapTo.amount || !swapFrom.amount;

  function confirm() {
    navigation.navigate(AppNavigation.Swap.Review);
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Space y={8} />
        <AvaText.Heading1 textStyle={{marginHorizontal: 16}}>
          Swap
        </AvaText.Heading1>
        {networkContext?.network === FUJI_NETWORK ? (
          <ZeroState.NoResults message={'Not available on Testnet'} />
        ) : (
          <>
            <Space y={20} />
            <TokenDropDown type={'From'} error={error} />
            <Space y={20} />
            <AvaButton.Base
              onPress={swapFromTo}
              style={{
                alignSelf: 'flex-end',
                borderRadius: 50,
                backgroundColor: theme.listItemBg,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginHorizontal: 16,
              }}>
              <SwapNarrowSVG />
            </AvaButton.Base>
            <TokenDropDown type={'To'} />
            <SwapTransactionDetail />
          </>
        )}
      </ScrollView>
      {networkContext?.network === FUJI_NETWORK || (
        <AvaButton.PrimaryLarge
          style={{margin: 16}}
          onPress={confirm}
          disabled={reviewButtonDisabled}>
          Review Order
        </AvaButton.PrimaryLarge>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
