import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { useNavigation, useRoute } from '@react-navigation/native'
import NftSend from 'screens/nft/send/NftSend'
import NftReview from 'screens/nft/send/NftReview'
import { SendNFTContextProvider } from 'contexts/SendNFTContext'
import {
  NFTDetailsScreenProps,
  NFTDetailsSendScreenProps
} from 'navigation/types'
import DoneScreen from 'screens/send/DoneScreen'
import { usePosthogContext } from 'contexts/PosthogContext'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'

export type NFTSendStackParamList = {
  [AppNavigation.NftSend.AddressPick]: undefined
  [AppNavigation.NftSend.Review]: undefined
  [AppNavigation.NftSend.Success]: { transactionId: string }
}

const NFTSendStack = createStackNavigator<NFTSendStackParamList>()

type NFTSendScreenProp = NFTDetailsScreenProps<typeof AppNavigation.Nft.Send>

export default function NFTSendScreenStack() {
  const { params } = useRoute<NFTSendScreenProp['route']>()
  const item = 'nft' in params ? params.nft : undefined
  const { sendBlocked } = usePosthogContext()
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
        <NFTSendStack.Screen
          name={AppNavigation.NftSend.Review}
          component={NftReviewScreen}
        />
        <NFTSendStack.Screen
          name={AppNavigation.NftSend.Success}
          component={SuccessScreen}
        />
      </NFTSendStack.Navigator>
      {sendBlocked && (
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

const NftSendScreen = () => {
  const { navigate } = useNavigation<AddressPickNavigationProp>()
  const showReviewScreen = () => {
    navigate(AppNavigation.NftSend.Review)
  }

  return (
    <NftSend
      onNext={showReviewScreen}
      onOpenAddressBook={() => navigate(AppNavigation.Wallet.AddressBook)}
    />
  )
}

type ReviewNavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.Review
>['navigation']

const NftReviewScreen = () => {
  const navigation = useNavigation<ReviewNavigationProp>()

  const onSuccess = () => {
    navigation.getParent()?.getParent()?.goBack()
  }
  return <NftReview onSuccess={onSuccess} />
}

type SuccessScreenProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.Success
>

const SuccessScreen = () => {
  const { goBack } = useNavigation<SuccessScreenProp['navigation']>()

  const { transactionId } = useRoute<SuccessScreenProp['route']>().params

  return <DoneScreen onClose={() => goBack()} transactionId={transactionId} />
}
