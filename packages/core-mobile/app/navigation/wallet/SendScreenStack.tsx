import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import SendToken from 'screens/send/SendToken'
import { useNavigation, useRoute } from '@react-navigation/native'
import ReviewSend from 'screens/send/ReviewSend'
import { SendTokenContextProvider } from 'contexts/SendTokenContext'
import { SendTokensScreenProps } from 'navigation/types'
import { usePosthogContext } from 'contexts/PosthogContext'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { TokenWithBalance } from 'store/balance'
import { SubHeaderOptions } from 'navigation/NavUtils'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { Contact } from 'store/addressBook'

export type SendStackParamList = {
  [AppNavigation.Send.Send]:
    | { token?: TokenWithBalance; contact?: Contact }
    | undefined
  [AppNavigation.Send.Review]: undefined
}

const SendStack = createStackNavigator<SendStackParamList>()

function SendScreenStack() {
  const { sendBlocked } = usePosthogContext()
  const { goBack } = useNavigation()

  return (
    <SendTokenContextProvider>
      <SendStack.Navigator
        screenOptions={{
          headerShown: true,
          title: ''
        }}>
        <SendStack.Screen
          options={SubHeaderOptions('')}
          name={AppNavigation.Send.Send}
          component={SendTokenComponent}
        />
        <SendStack.Screen
          options={SubHeaderOptions('')}
          name={AppNavigation.Send.Review}
          component={ReviewSendComponent}
        />
      </SendStack.Navigator>
      {sendBlocked && (
        <FeatureBlocked
          onOk={goBack}
          message={
            'Send is currently under maintenance.  Service will resume shortly.'
          }
        />
      )}
    </SendTokenContextProvider>
  )
}

type SendScreenProps = SendTokensScreenProps<typeof AppNavigation.Send.Send>

const SendTokenComponent = () => {
  const { navigate } = useNavigation<SendScreenProps['navigation']>()
  const { params } = useRoute<SendScreenProps['route']>()
  const { capture } = usePostCapture()

  const onOpenSelectToken = (
    onTokenSelected: (token: TokenWithBalance) => void
  ) => {
    navigate(AppNavigation.Modal.SelectToken, {
      onTokenSelected: (token: TokenWithBalance) => {
        onTokenSelected(token)
        capture('Send_TokenSelected')
      }
    })
  }

  return (
    <SendToken
      contact={params?.contact}
      token={params?.token}
      onNext={() => navigate(AppNavigation.Send.Review)}
      onOpenAddressBook={() => navigate(AppNavigation.Wallet.AddressBook)}
      onOpenSelectToken={onOpenSelectToken}
    />
  )
}

type ReviewNavigationProp = SendTokensScreenProps<
  typeof AppNavigation.Send.Review
>['navigation']

const ReviewSendComponent = () => {
  const navigation = useNavigation<ReviewNavigationProp>()

  const onSuccess = () => {
    navigation.getParent()?.goBack()
  }

  return <ReviewSend onSuccess={onSuccess} />
}

export default SendScreenStack
