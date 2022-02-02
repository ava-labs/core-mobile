import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import DoneScreen from 'screens/send/DoneScreen';
import SendToken from 'screens/send/SendToken';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import ReviewSend from 'screens/send/ReviewSend';
import {SendTokenContextProvider} from 'contexts/SendTokenContext';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import {TokenWithBalance} from '@avalabs/wallet-react-components';

export type SendStackParamList = {
  [AppNavigation.Send.Send]: {token?: TokenWithBalance} | undefined;
  [AppNavigation.Send.Review]: undefined;
  [AppNavigation.Send.Success]: {transactionId: string};
};

const SendStack = createStackNavigator<SendStackParamList>();

function SendScreenStack() {
  const {params} = useRoute<RouteProp<RootStackParamList>>();

  return (
    <SendTokenContextProvider>
      <SendStack.Navigator
        screenOptions={{
          headerShown: true,
          title: '',
        }}>
        <SendStack.Screen
          name={AppNavigation.Send.Send}
          component={SendTokenComponent}
          initialParams={params}
        />
        <SendStack.Screen
          name={AppNavigation.Send.Review}
          component={ReviewSendComponent}
        />
        <SendStack.Screen
          name={AppNavigation.Send.Success}
          component={DoneScreenComponent}
        />
      </SendStack.Navigator>
    </SendTokenContextProvider>
  );
}

const SendTokenComponent = () => {
  const {navigate} = useNavigation<StackNavigationProp<SendStackParamList>>();
  const {params} = useRoute<RouteProp<SendStackParamList>>();
  return (
    <SendToken
      contact={params?.contact}
      token={params?.token}
      onNext={() => navigate(AppNavigation.Send.Review)}
    />
  );
};

const ReviewSendComponent = () => {
  const navigation = useNavigation<StackNavigationProp<SendStackParamList>>();

  const onSuccess = (transactionId: string) => {
    navigation.popToTop();
    navigation.replace(AppNavigation.Send.Success, {transactionId});
  };

  return <ReviewSend onSuccess={onSuccess} />;
};

const DoneScreenComponent = () => {
  const {goBack} = useNavigation<StackNavigationProp<RootStackParamList>>();
  return <DoneScreen onClose={() => goBack()} />;
};

export default SendScreenStack;
