import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigatorScreenParams } from '@react-navigation/native'
import NftFullScreen from 'screens/nft/NftFullScreen'
import NFTSendScreenStack, {
  NFTSendStackParamList
} from 'navigation/wallet/NFTSendStack'
import { NFTItemData } from 'store/nft'
import NftDetailsScreen from 'screens/nft/NftDetailsScreen'

export type NFTStackParamList = {
  [AppNavigation.Nft.Details]: { nft: NFTItemData }
  [AppNavigation.Nft.Send]:
    | { nft: NFTItemData }
    | NavigatorScreenParams<NFTSendStackParamList>
  [AppNavigation.Nft.FullScreen]: {
    url: string
    isSvg: boolean
  }
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
