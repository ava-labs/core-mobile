import React, {useEffect} from 'react';
import AppNavigation from 'navigation/AppNavigation';
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack';
import NftListView from 'screens/nft/NftListView';
import {NFTItem} from 'screens/nft/NFTItem';
import {useNavigation} from '@react-navigation/native';
import NftDetails from 'screens/nft/NftDetails';
import NftFullScreen from 'screens/nft/NftFullScreen';
import NftManage from 'screens/nft/NftManage';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {UID} from 'Repo';
import {v4 as uuidv4} from 'uuid';
import NFTSendScreenStack from 'navigation/wallet/NFTSendStack';

export type NFTStackParamList = {
  [AppNavigation.Nft.List]: undefined;
  [AppNavigation.Nft.Manage]: undefined;
  [AppNavigation.Nft.Details]: {nft: NFTItem};
  [AppNavigation.Nft.Send]: {nft: NFTItem};
  [AppNavigation.Nft.FullScreen]: {url: string};
};

const NFTStack = createStackNavigator<NFTStackParamList>();

function NFTScreenStack() {
  const {repo} = useApplicationContext();
  useEffect(() => {
    const mockedMapData = new Map<UID, NFTItem>();
    mockData.forEach(value => mockedMapData.set(uuidv4(), value));
    repo.nftRepo.saveNfts(mockedMapData);
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
  const openNftDetails = (item: NFTItem) => {
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
  const openImageFull = (url: string) => {
    navigate(AppNavigation.Nft.FullScreen, {url});
  };
  const openSendNftScreen = (item: NFTItem) => {
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

const mockData: NFTItem[] = [
  {
    title: 'Ljubo',
    imageURL:
      'https://images.theconversation.com/files/71773/original/image-20150211-25679-rdtqd.JPG?ixlib=rb-1.1.0&q=45&auto=format&w=926&fit=clip',
    properties: {
      Background: 'Orange',
    },
    isShowing: true,
  },
  {
    title: 'Pero',
    imageURL:
      'https://media.npr.org/assets/img/2015/10/08/istock_000013696787_small-40f929a109f759d798fc1d8afc718cc78a2ac18b-s1100-c50.jpg',
    properties: {
      Eyes: 'Heart',
    },
    isShowing: true,
  },
  {
    title: 'Mikelanđelo',
    imageURL:
      'https://i.guim.co.uk/img/media/28b2df5e8caaa585fcb6822448f2df842f9f6c1a/0_0_5100_3060/master/5100.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=7662830839f408a0f639c55b5eb1b47f',
    properties: {
      Fur: 'Brown',
    },
    isShowing: false,
  },
  {
    title: 'Fabi',
    imageURL: 'https://www.biologiaevolutiva.org/greatape/img/bonobo.jpeg',
    properties: {
      Clothes: 'Leather Punk Jacket',
    },
    isShowing: true,
  },
];
