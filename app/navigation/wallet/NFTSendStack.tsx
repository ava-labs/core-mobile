import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {NFTItemData} from 'screens/nft/NftCollection';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NFTStackParamList} from 'navigation/wallet/NFTScreenStack';
import NftSend from 'screens/nft/send/NftSend';
import NftReview from 'screens/nft/send/NftReview';
import {SendNFTContextProvider} from 'contexts/SendNFTContext';
import {RootStackParamList} from 'navigation/WalletScreenStack';
import DoneScreen from 'screens/send/DoneScreen';
import {usePosthogContext} from 'contexts/PosthogContext';
import FeatureBlocked from 'screens/posthog/FeatureBlocked';

export type NFTSendStackParamList = {
  [AppNavigation.NftSend.AddressPick]: undefined;
  [AppNavigation.NftSend.Review]: undefined;
  [AppNavigation.NftSend.Success]: {transactionId: string};
  [AppNavigation.NftSend.Fail]: undefined;
};

const NFTSendStack = createStackNavigator<NFTSendStackParamList>();

export default function NFTSendScreenStack() {
  const {params} =
    useRoute<RouteProp<NFTStackParamList, typeof AppNavigation.Nft.Send>>();
  const item = params?.nft as NFTItemData;

  const {sendBlocked} = usePosthogContext();
  const {goBack} = useNavigation<StackNavigationProp<NFTStackParamList>>();

  return (
    <SendNFTContextProvider nft={item}>
      <NFTSendStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          title: '',
          headerBackTitleVisible: false,
          headerTitleAlign: 'center',
        }}>
        <NFTSendStack.Screen
          name={AppNavigation.NftSend.AddressPick}
          component={NftSendScreen}
        />
        <NFTSendStack.Screen
          name={AppNavigation.NftSend.Review}
          component={NftReviewScreen}
        />
        <NFTSendStack.Screen
          name={AppNavigation.NftSend.Success}
          component={SuccessScreen}
        />
      </NFTSendStack.Navigator>
      {sendBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'NFT is currently under maintenance.  Service will resume shortly.'
          }
        />
      )}
    </SendNFTContextProvider>
  );
}

const NftSendScreen = () => {
  const {navigate} =
    useNavigation<StackNavigationProp<NFTSendStackParamList>>();
  const showReviewScreen = () => {
    navigate(AppNavigation.NftSend.Review);
  };
  return <NftSend onNext={showReviewScreen} />;
};

const NftReviewScreen = () => {
  const {popToTop, replace} =
    useNavigation<StackNavigationProp<NFTSendStackParamList>>();
  const showSuccessScreen = (transactionId: string) => {
    popToTop();
    replace(AppNavigation.NftSend.Success, {transactionId});
  };
  return <NftReview onSuccess={showSuccessScreen} />;
};

const SuccessScreen = () => {
  const {goBack} = useNavigation<StackNavigationProp<RootStackParamList>>();

  const transactionId =
    useRoute<RouteProp<NFTSendStackParamList>>()!.params!.transactionId!;

  return <DoneScreen onClose={() => goBack()} transactionId={transactionId} />;
};
