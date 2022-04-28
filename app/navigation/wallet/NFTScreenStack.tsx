import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { NavigatorScreenParams } from '@react-navigation/native'
import { NFTItemData } from 'screens/nft/NftCollection'
import { useNavigation, useRoute } from '@react-navigation/native'
import NftDetails from 'screens/nft/NftDetails'
import NftFullScreen from 'screens/nft/NftFullScreen'
import NFTSendScreenStack, {
  NFTSendStackParamList
} from 'navigation/wallet/NFTSendStack'
import { NFTDetailsScreenProps } from 'navigation/types'

export type NFTStackParamList = {
  [AppNavigation.Nft.Details]: { nft: NFTItemData }
  [AppNavigation.Nft.Send]:
    | { nft: NFTItemData }
    | NavigatorScreenParams<NFTSendStackParamList>
  [AppNavigation.Nft.FullScreen]: { url: string; urlSmall: string }
}

const NFTStack = createStackNavigator<NFTStackParamList>()

function NFTScreenStack() {
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

type NftDetailsScreenProps = NFTDetailsScreenProps<
  typeof AppNavigation.Nft.Details
>

const NftDetailsScreen = () => {
  const { navigate } = useNavigation<NftDetailsScreenProps['navigation']>()
  const { params } = useRoute<NftDetailsScreenProps['route']>()

  const openImageFull = (url: string, urlSmall: string) => {
    navigate(AppNavigation.Nft.FullScreen, { url, urlSmall })
  }

  const openSendNftScreen = (item: NFTItemData) => {
    navigate(AppNavigation.Nft.Send, { nft: item })
  }

  return (
    <NftDetails
      nft={params.nft}
      onPicturePressed={openImageFull}
      onSendPressed={openSendNftScreen}
    />
  )
}

export default React.memo(NFTScreenStack)
