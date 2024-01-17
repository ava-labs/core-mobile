import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import {
  NavigatorScreenParams,
  useNavigation,
  useRoute
} from '@react-navigation/native'
import NftDetails from 'screens/nft/NftDetails'
import NftFullScreen from 'screens/nft/NftFullScreen'
import NFTSendScreenStack, {
  NFTSendStackParamList
} from 'navigation/wallet/NFTSendStack'
import { NFTDetailsScreenProps } from 'navigation/types'
import { NFTItemData } from 'store/nft'
import AnalyticsService from 'services/analytics/AnalyticsService'

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

type NftDetailsScreenProps = NFTDetailsScreenProps<
  typeof AppNavigation.Nft.Details
>

const NftDetailsScreen = (): JSX.Element => {
  const { navigate } = useNavigation<NftDetailsScreenProps['navigation']>()
  const { params } = useRoute<NftDetailsScreenProps['route']>()

  const openImageFull = (url: string, isSvg: boolean): void => {
    navigate(AppNavigation.Nft.FullScreen, { url, isSvg })
  }

  const openSendNftScreen = (item: NFTItemData): void => {
    AnalyticsService.capture('CollectibleSendClicked', {
      chainId: item.chainId
    })
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
