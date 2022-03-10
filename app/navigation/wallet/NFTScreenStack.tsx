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
import NFTSendScreenStack from 'navigation/wallet/NFTSendStack';
import {Covalent} from '@avalabs/covalent-sdk';
import {
  useAccountsContext,
  useNetworkContext,
} from '@avalabs/wallet-react-components';
import {Config} from 'react-native-config';
import {useNftLoader} from 'screens/nft/useNftLoader';

export type NFTStackParamList = {
  [AppNavigation.Nft.List]: undefined;
  [AppNavigation.Nft.Manage]: undefined;
  [AppNavigation.Nft.Details]: {nft: NFTItemData};
  [AppNavigation.Nft.Send]: {nft: NFTItemData};
  [AppNavigation.Nft.FullScreen]: {url: string; urlSmall: string};
};

const NFTStack = createStackNavigator<NFTStackParamList>();

function NFTScreenStack() {
  const {network} = useNetworkContext()!;
  const {activeAccount} = useAccountsContext();
  const {parseNftCollections} = useNftLoader();

  useEffect(() => {
    const chainID = 1 || Number.parseInt(network?.chainId ?? '0', 10);
    const covalent = new Covalent(chainID, Config.COVALENT_API_KEY);
    const addressC =
      '0x470820fbbfca29de49c4a474d12af264856d2028' ||
      '0xe4605d46fd0b3f8329d936a8b258d69276cba264' ||
      activeAccount?.wallet.getAddressC();
    console.log(chainID);
    if (addressC) {
      covalent.getAddressBalancesV2(addressC, true).then(value => {
        parseNftCollections(value.data.items as unknown as NftCollection[]);
      });
    }
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
