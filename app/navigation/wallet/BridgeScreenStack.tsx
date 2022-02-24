import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {createStackNavigator} from '@react-navigation/stack';
import SwapView from 'screens/swap/SwapView';
import SwapReview from 'screens/swap/SwapReview';
import DoneScreen from 'screens/swap/DoneScreen';
import FailScreen from 'screens/swap/FailScreen';
import HeaderAccountSelector from 'components/HeaderAccountSelector';
import {SwapContextProvider} from 'contexts/SwapContext';
import EditGasLimitBottomSheet from 'screens/shared/EditGasLimitBottomSheet';
import {BridgeProvider} from 'screens/bridge/BridgeProvider';
import Bridge from 'screens/bridge/Bridge';
import BridgeActivityDetail from 'screens/bridge/BridgeActivityDetail';
import {SubHeaderOptions} from 'navigation/NavUtils';

export type BridgeStackParamList = {
  [AppNavigation.Bridge.Bridge]: undefined;
  [AppNavigation.Bridge.ActivityDetail]: {
    blockchain: string;
    resultHash: string;
  };
};

const BridgeStack = createStackNavigator<BridgeStackParamList>();

function BridgeScreenStack() {
  return (
    <BridgeProvider>
      <BridgeStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          headerBackTitleVisible: false,
          headerTitleAlign: 'center',
        }}>
        <BridgeStack.Screen
          options={{headerShown: false}}
          name={AppNavigation.Bridge.Bridge}
          component={Bridge}
        />
        <BridgeStack.Screen
          options={{
            ...SubHeaderOptions('Transaction Details'),
          }}
          name={AppNavigation.Bridge.ActivityDetail}
          component={BridgeActivityDetail}
        />
      </BridgeStack.Navigator>
    </BridgeProvider>
  );
}

export default React.memo(BridgeScreenStack);
