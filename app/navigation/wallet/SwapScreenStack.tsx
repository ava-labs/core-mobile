import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {createStackNavigator} from '@react-navigation/stack';
import SwapView from 'screens/swap/SwapView';
import SwapReview from 'screens/swap/SwapReview';
import DoneScreen from 'screens/swap/DoneScreen';

export type SwapStackParamList = {
  [AppNavigation.Swap.Swap]: undefined;
  [AppNavigation.Swap.Review]: undefined;
  [AppNavigation.Swap.Success]: undefined;
};

const SwapStack = createStackNavigator<SwapStackParamList>();

function SwapScreenStack() {
  return (
    <SwapStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <SwapStack.Screen name={AppNavigation.Swap.Swap} component={SwapView} />
      <SwapStack.Screen
        name={AppNavigation.Swap.Review}
        component={SwapReview}
      />
      <SwapStack.Screen
        name={AppNavigation.Swap.Success}
        component={DoneScreen}
      />
    </SwapStack.Navigator>
  );
}

export default React.memo(SwapScreenStack);
