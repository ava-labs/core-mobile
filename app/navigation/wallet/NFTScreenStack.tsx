import React, {useEffect} from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import NftListView from 'screens/nft/NftListView';
import {NftCollection, NFTItemData} from 'screens/nft/NftCollection';
import {useNavigation} from '@react-navigation/native';
import NftDetails from 'screens/nft/NftDetails';
import NftFullScreen from 'screens/nft/NftFullScreen';
import NftManage from 'screens/nft/NftManage';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {UID} from 'Repo';
import NFTSendScreenStack from 'navigation/wallet/NFTSendStack';
import {NFTs} from 'screens/nft/MockData';

export type NFTStackParamList = {
  [AppNavigation.Nft.List]: undefined;
  [AppNavigation.Nft.Manage]: undefined;
  [AppNavigation.Nft.Details]: {nft: NFTItemData};
  [AppNavigation.Nft.Send]: {nft: NFTItemData};
  [AppNavigation.Nft.FullScreen]: {url: string; urlSmall: string};
};

const NFTStack = createStackNavigator<NFTStackParamList>();

function NFTScreenStack() {
  const {repo} = useApplicationContext();
  useEffect(() => {
    const nftDataItems = new Map<UID, NFTItemData>();
    NFTs.forEach(collection => {
      collection.nft_data.forEach(nftData => {
        const nft = nftData as NFTItemData;
        nft.collection = (({nft_data, ...o}) => o)(
          collection,
        ) as unknown as NftCollection; // remove nft_data to save on memory
        nftDataItems.set(nft.token_id, nft);
      });
    });
    repo.nftRepo.saveNfts(nftDataItems);
  }, []);

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
        name={AppNavigation.Nft.List}
        component={NftListViewScreen}
      />
      <NFTStack.Screen name={AppNavigation.Nft.Manage} component={NftManage} />
      <NFTStack.Screen
        name={AppNavigation.Nft.Details}
        component={NftDetailsScreen}
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

const NftListViewScreen = () => {
  const {navigate} = useNavigation<StackNavigationProp<NFTStackParamList>>();
  const openNftDetails = (item: NFTItemData) => {
    navigate(AppNavigation.Nft.Details, {nft: item});
  };
  const openNftManage = () => {
    navigate(AppNavigation.Nft.Manage);
  };
  return (
    <NftListView
      onItemSelected={openNftDetails}
      onManagePressed={openNftManage}
    />
  );
};

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
