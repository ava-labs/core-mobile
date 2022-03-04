import React, {
  createContext,
  Dispatch,
  useContext,
  useMemo,
  useState,
} from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {NFTItem} from 'screens/nft/NFTItem';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NFTStackParamList} from 'navigation/wallet/NFTScreenStack';
import NftSend from 'screens/nft/send/NftSend';
import NftReview from 'screens/nft/send/NftReview';

export type NFTSendStackParamList = {
  [AppNavigation.NftSend.AddressPick]: undefined;
  [AppNavigation.NftSend.Review]: undefined;
  [AppNavigation.NftSend.Success]: undefined;
  [AppNavigation.NftSend.Fail]: undefined;
};

const NFTSendStack = createStackNavigator<NFTSendStackParamList>();

const NFTSendContext = createContext(
  {} as {
    nft: NFTItem;
    addressTo: string;
    setAddressTo: Dispatch<string>;
  },
);

export function useNftSendContext() {
  return useContext(NFTSendContext);
}

export default function NFTSendScreenStack() {
  const {params} = useRoute<RouteProp<NFTStackParamList>>();
  const item = useMemo(() => params!.nft, [params]) as NFTItem;
  const [addressTo, setAddressTo] = useState('');

  return (
    <NFTSendContext.Provider value={{nft: item, addressTo, setAddressTo}}>
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
          component={NftReview}
        />
      </NFTSendStack.Navigator>
    </NFTSendContext.Provider>
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
