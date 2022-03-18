import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import Bridge from 'screens/bridge/Bridge';
import BridgeTransactionStatus from 'screens/bridge/BridgeTransactionStatus';
import {MainHeaderOptions, SubHeaderOptions} from 'navigation/NavUtils';
import BridgeSelectTokenBottomSheet from 'screens/bridge/BridgeSelectTokenBottomSheet';
import {useNavigation} from '@react-navigation/native';
import WarningModal from 'components/WarningModal';

export type BridgeStackParamList = {
  [AppNavigation.Bridge.Bridge]: undefined;
  [AppNavigation.Bridge.BridgeTransactionStatus]: {
    blockchain: string;
    txHash: string;
    txTimestamp: string;
  };
  [AppNavigation.Bridge.HideWarning]: undefined;
  [AppNavigation.Modal.BridgeSelectToken]: {
    onTokenSelected: (token: string) => void;
  };
};

const BridgeStack = createStackNavigator<BridgeStackParamList>();

function BridgeScreenStack() {
  return (
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
        <BridgeStack.Screen
          options={{presentation: 'transparentModal', headerShown: false}}
          name={AppNavigation.Bridge.HideWarning}
          component={HideTransactionWarningModal}
        />
      </BridgeStack.Group>
    </BridgeStack.Navigator>
  );
}

const HideTransactionWarningModal = () => {
  const navigation = useNavigation<StackNavigationProp<BridgeStackParamList>>();

  const onHide = () => {
    navigation.getParent()?.goBack();
  };

  const onBack = () => {
    navigation.goBack();
  };

  return (
    <WarningModal
      title={'Hide Processing Transaction'}
      message={
        'Your transaction is still processing. Go to Activity to see the current status.'
      }
      actionText={'Hide'}
      dismissText={'Back'}
      onAction={onHide}
      onDismiss={onBack}
    />
  );
};

export default React.memo(BridgeScreenStack);
