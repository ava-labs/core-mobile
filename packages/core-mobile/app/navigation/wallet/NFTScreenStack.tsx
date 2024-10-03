import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import NftFullScreen from 'screens/nft/NftFullScreen'
import NFTSendScreenStack from 'navigation/wallet/NFTSendStack'
import { NFTImageData, NFTItem } from 'store/nft'
import NftDetailsScreen from 'screens/nft/NftDetailsScreen'

export type NFTStackParamList = {
  [AppNavigation.Nft.Details]: { nftItem: NFTItem }
  [AppNavigation.Nft.Send]: { nft: NFTItem }
  [AppNavigation.Nft.FullScreen]: { imageData: NFTImageData }
}

const NFTStack = createStackNavigator<NFTStackParamList>()

function NFTScreenStack(): JSX.Element {
  return (
    <NFTStack.Navigator
      screenOptions={{
        presentation: 'card',
        headerShown: true,
        title: '',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center'
      }}>
      <NFTStack.Screen
        name={AppNavigation.Nft.Details}
        component={NftDetailsScreen}
      />
      <NFTStack.Screen
        options={{ headerShown: false }}
        name={AppNavigation.Nft.Send}
        component={NFTSendScreenStack}
      />
      <NFTStack.Screen
        options={{
          headerTransparent: true
        }}
        name={AppNavigation.Nft.FullScreen}
        component={NftFullScreen}
      />
    </NFTStack.Navigator>
  )
}

export default React.memo(NFTScreenStack)
