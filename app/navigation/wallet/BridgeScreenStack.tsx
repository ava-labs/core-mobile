import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {createStackNavigator} from '@react-navigation/stack';
import Bridge from 'screens/bridge/Bridge';
import BridgeTransactionStatus from 'screens/bridge/BridgeTransactionStatus';
import {MainHeaderOptions, SubHeaderOptions} from 'navigation/NavUtils';
import BridgeSelectTokenBottomSheet from 'screens/bridge/BridgeSelectTokenBottomSheet';
import {BridgeSDKProvider} from '@avalabs/bridge-sdk';

export type BridgeStackParamList = {
  [AppNavigation.Bridge.Bridge]: undefined;
  [AppNavigation.Bridge.BridgeTransactionStatus]: {
    blockchain: string;
    txHash: string;
    txTimestamp: string;
  };
  [AppNavigation.Modal.BridgeSelectToken]: {
    onTokenSelected: (token: string) => void;
  };
};

const BridgeStack = createStackNavigator<BridgeStackParamList>();

function BridgeScreenStack() {
  return (
    <BridgeSDKProvider>
      <BridgeStack.Navigator>
        <BridgeStack.Screen
          options={{
            ...MainHeaderOptions('Bridge'),
          }}
          name={AppNavigation.Bridge.Bridge}
          component={Bridge}
        />
        <BridgeStack.Screen
          options={{
            ...SubHeaderOptions('Transaction Status'),
          }}
          name={AppNavigation.Bridge.BridgeTransactionStatus}
          component={BridgeTransactionStatus}
        />
        <BridgeStack.Group screenOptions={{presentation: 'transparentModal'}}>
          <BridgeStack.Screen
            options={{headerShown: false}}
            name={AppNavigation.Modal.BridgeSelectToken}
            component={BridgeSelectTokenBottomSheet}
          />
        </BridgeStack.Group>
      </BridgeStack.Navigator>
    </BridgeSDKProvider>
  );
}

export default React.memo(BridgeScreenStack);
