import React from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import {NFTItemData} from 'screens/nft/NftCollection';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import NftDetails from 'screens/nft/NftDetails';
import NftFullScreen from 'screens/nft/NftFullScreen';
import NFTSendScreenStack from 'navigation/wallet/NFTSendStack';
import {RootStackParamList} from 'navigation/WalletScreenStack';

export type NFTStackParamList = {
  [AppNavigation.Nft.Details]: {nft: NFTItemData};
  [AppNavigation.Nft.Send]: {nft: NFTItemData};
  [AppNavigation.Nft.FullScreen]: {url: string; urlSmall: string};
};

const NFTStack = createStackNavigator<NFTStackParamList>();

function NFTScreenStack() {
  const {params} = useRoute<RouteProp<RootStackParamList>>();
  const item = params?.nft as NFTItemData;

  return (
    <NFTStack.Navigator
      screenOptions={{
        presentation: 'card',
        headerShown: true,
        title: '',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
      }}>
      <NFTStack.Screen
        name={AppNavigation.Nft.Details}
        component={NftDetailsScreen}
        initialParams={{nft: item}}
      />
      <NFTStack.Screen
        options={{headerShown: false}}
        name={AppNavigation.Nft.Send}
        component={NFTSendScreenStack}
      />
      <NFTStack.Screen
        options={{
          headerTransparent: true,
        }}
        name={AppNavigation.Nft.FullScreen}
        component={NftFullScreen}
      />
    </NFTStack.Navigator>
  );
}

const NftDetailsScreen = () => {
  const {navigate} = useNavigation<StackNavigationProp<NFTStackParamList>>();
  const openImageFull = (url: string, urlSmall: string) => {
    navigate(AppNavigation.Nft.FullScreen, {url, urlSmall});
  };
  const openSendNftScreen = (item: NFTItemData) => {
    navigate(AppNavigation.Nft.Send, {nft: item});
  };
  return (
    <NftDetails
      onPicturePressed={openImageFull}
      onSendPressed={openSendNftScreen}
    />
  );
};

export default React.memo(NFTScreenStack);
