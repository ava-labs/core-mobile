import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { useNavigation, useRoute } from '@react-navigation/native'
import NftSend from 'screens/nft/send/NftSend'
import {
  NFTDetailsScreenProps,
  NFTDetailsSendScreenProps
} from 'navigation/types'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { useSelector } from 'react-redux'
import { selectIsSendBlocked } from 'store/posthog'
import { SendContextProvider, useSendContext } from 'contexts/SendContext'
import { NftItem } from 'services/nft/types'

export type NFTSendStackParamList = {
  [AppNavigation.NftSend.Send]: { nft: NftItem }
}

const NFTSendStack = createStackNavigator<NFTSendStackParamList>()

type NFTSendScreenProp = NFTDetailsScreenProps<typeof AppNavigation.Nft.Send>

export default function NFTSendScreenStack(): JSX.Element | null {
  const { params } = useRoute<NFTSendScreenProp['route']>()
  const item = params.nft
  const isSendBlocked = useSelector(selectIsSendBlocked)
  const { goBack } = useNavigation<NFTSendScreenProp['navigation']>()

  if (item === undefined) return null

  return (
    <SendContextProvider initialToken={item}>
      <NFTSendStack.Navigator
        screenOptions={{
          presentation: 'card',
          headerShown: true,
          title: '',
          headerBackButtonDisplayMode: 'minimal',
          headerTitleAlign: 'center'
        }}>
        <NFTSendStack.Screen
          name={AppNavigation.NftSend.Send}
          component={NftSendScreen}
          initialParams={{ nft: item }}
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
    </SendContextProvider>
  )
}

type AddressPickNavigationProp = NFTDetailsSendScreenProps<
  typeof AppNavigation.NftSend.Send
>['navigation']

const NftSendScreen = (): JSX.Element => {
  const { navigate } = useNavigation<AddressPickNavigationProp>()

  const navigation = useNavigation<NFTSendScreenProp['navigation']>()
  const { setToAddress } = useSendContext()

  const handleOpenQRScanner = (): void => {
    navigation.navigate(AppNavigation.Modal.QRScanner, {
      onSuccess: (data: string) => {
        setToAddress(data)
      }
    })
  }

  return (
    <NftSend
      onOpenAddressBook={() => navigate(AppNavigation.Wallet.AddressBook)}
      onOpenQRScanner={() => handleOpenQRScanner()}
    />
  )
}
