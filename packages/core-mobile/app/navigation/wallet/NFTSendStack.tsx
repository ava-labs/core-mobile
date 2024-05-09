import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { useNavigation, useRoute } from '@react-navigation/native'
import NftSend from 'screens/nft/send/NftSend'
import { SendNFTContextProvider } from 'contexts/SendNFTContext'
import {
  NFTDetailsScreenProps,
  NFTDetailsSendScreenProps
} from 'navigation/types'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { useSelector } from 'react-redux'
import { selectIsSendBlocked } from 'store/posthog'

export type NFTSendStackParamList = {
  [AppNavigation.NftSend.AddressPick]: undefined
}

const NFTSendStack = createStackNavigator<NFTSendStackParamList>()

type NFTSendScreenProp = NFTDetailsScreenProps<typeof AppNavigation.Nft.Send>

export default function NFTSendScreenStack(): JSX.Element | null {
  const { params } = useRoute<NFTSendScreenProp['route']>()
  const item = 'nft' in params ? params.nft : undefined
  const isSendBlocked = useSelector(selectIsSendBlocked)
  const { goBack } = useNavigation<NFTSendScreenProp['navigation']>()

  if (item === undefined) return null

  return (
    <SendNFTContextProvider nft={item}>
      <NFTSendStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          title: '',
          headerBackTitleVisible: false,
          headerTitleAlign: 'center'
        }}>
        <NFTSendStack.Screen
          name={AppNavigation.NftSend.AddressPick}
          component={NftSendScreen}
        />
      </NFTSendStack.Navigator>
      {isSendBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'NFT is currently under maintenance.  Service will resume shortly.'
          }
        />
      )}
    </SendNFTContextProvider>
  )
}

type AddressPickNavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.AddressPick
>['navigation']

const NftSendScreen = (): JSX.Element => {
  const { navigate } = useNavigation<AddressPickNavigationProp>()

  return (
    <NftSend
      onOpenAddressBook={() => navigate(AppNavigation.Wallet.AddressBook)}
    />
  )
}
