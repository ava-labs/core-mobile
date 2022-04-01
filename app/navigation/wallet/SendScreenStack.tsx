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
import {usePosthogContext} from 'contexts/PosthogContext';
import FeatureBlocked from 'screens/posthog/FeatureBlocked';

export type SendStackParamList = {
  [AppNavigation.Send.Send]: {token?: TokenWithBalance} | undefined;
  [AppNavigation.Send.Review]: undefined;
  [AppNavigation.Send.Success]: {transactionId: string};
};

const SendStack = createStackNavigator<SendStackParamList>();

function SendScreenStack() {
  const {params} =
    useRoute<
      RouteProp<RootStackParamList, typeof AppNavigation.Wallet.SendTokens>
    >();
  const {sendBlocked} = usePosthogContext();
  const {goBack} = useNavigation<StackNavigationProp<RootStackParamList>>();

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
      {sendBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Send is currently under maintenance.  Service will resume shortly.'
          }
        />
      )}
    </SendTokenContextProvider>
  );
}

const SendTokenComponent = () => {
  const {navigate} = useNavigation<StackNavigationProp<SendStackParamList>>();
  const {navigate: rootNavigate} =
    useNavigation<StackNavigationProp<SendStackParamList>>().getParent<
      StackNavigationProp<RootStackParamList>
    >();
  const {params} =
    useRoute<
      RouteProp<RootStackParamList, typeof AppNavigation.Wallet.SendTokens>
    >();
  return (
    <SendToken
      contact={params?.contact}
      token={params?.token}
      onNext={() => navigate(AppNavigation.Send.Review)}
      onOpenAddressBook={() => rootNavigate(AppNavigation.Wallet.AddressBook)}
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
  const transactionId =
    useRoute<RouteProp<SendStackParamList, typeof AppNavigation.Send.Success>>()
      ?.params?.transactionId;

  return (
    <DoneScreen onClose={() => goBack()} transactionId={transactionId ?? ''} />
  );
};

export default SendScreenStack;
