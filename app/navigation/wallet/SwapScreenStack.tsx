import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import SwapView from 'screens/swap/SwapView';
import SwapReview from 'screens/swap/SwapReview';
import DoneScreen from 'screens/swap/DoneScreen';
import FailScreen from 'screens/swap/FailScreen';
import HeaderAccountSelector from 'components/HeaderAccountSelector';
import {SwapContextProvider} from 'contexts/SwapContext';
import EditGasLimitBottomSheet from 'screens/shared/EditGasLimitBottomSheet';
import {usePosthogContext} from 'contexts/PosthogContext';
import {useNavigation} from '@react-navigation/native';
import FeatureBlocked from 'screens/posthog/FeatureBlocked';
import {RootStackParamList} from 'navigation/WalletScreenStack';

export type SwapStackParamList = {
  [AppNavigation.Swap.Swap]: undefined;
  [AppNavigation.Swap.Review]: undefined;
  [AppNavigation.Swap.Success]: undefined;
  [AppNavigation.Swap.Fail]: {errorMsg: string};
  [AppNavigation.Swap.SwapTransactionFee]: undefined;
};

const SwapStack = createStackNavigator<SwapStackParamList>();

function SwapScreenStack() {
  const {swapBlocked} = usePosthogContext();
  const {goBack} = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <SwapContextProvider>
      <SwapStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          headerBackTitleVisible: false,
          headerTitleAlign: 'center',
          headerTitle: () => <HeaderAccountSelector />,
        }}>
        <SwapStack.Screen name={AppNavigation.Swap.Swap} component={SwapView} />
        <SwapStack.Screen
          options={{
            headerTitle: '',
          }}
          name={AppNavigation.Swap.Review}
          component={SwapReview}
        />
        <SwapStack.Screen
          name={AppNavigation.Swap.Success}
          component={DoneScreen}
        />
        <SwapStack.Screen
          name={AppNavigation.Swap.Fail}
          component={FailScreen}
        />
        <SwapStack.Screen
          options={{
            presentation: 'transparentModal',
            transitionSpec: {
              open: {animation: 'timing', config: {duration: 0}},
              close: {animation: 'timing', config: {duration: 300}},
            },
          }}
          name={AppNavigation.Swap.SwapTransactionFee}
          component={EditGasLimitBottomSheet}
        />
      </SwapStack.Navigator>
      {swapBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Swap is currently under maintenance. Service will resume shortly.'
          }
        />
      )}
    </SwapContextProvider>
  );
}

export default React.memo(SwapScreenStack);
