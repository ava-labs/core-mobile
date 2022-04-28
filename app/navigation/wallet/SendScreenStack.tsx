import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { ERC20WithBalance } from '@avalabs/wallet-react-components'
import DoneScreen from 'screens/send/DoneScreen'
import SendToken from 'screens/send/SendToken'
import { useNavigation, useRoute } from '@react-navigation/native'
import ReviewSend from 'screens/send/ReviewSend'
import { SendTokenContextProvider } from 'contexts/SendTokenContext'
import { SendTokensScreenProps } from 'navigation/types'
import { TokenWithBalance } from '@avalabs/wallet-react-components'
import { usePosthogContext } from 'contexts/PosthogContext'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { Contact } from 'Repo'

export type SendStackParamList = {
  [AppNavigation.Send.Send]:
    | { token?: TokenWithBalance; contact?: Contact }
    | undefined
  [AppNavigation.Send.Review]: undefined
  [AppNavigation.Send.Success]: { transactionId: string }
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
          name={AppNavigation.Send.Send}
          component={SendTokenComponent}
        />
        <SendStack.Screen
          name={AppNavigation.Send.Review}
          component={ReviewSendComponent}
        />
        <SendStack.Screen
          name={AppNavigation.Send.Success}
          component={DoneScreenComponent}
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

  const onOpenSelectToken = (
    onTokenSelected: (token: ERC20WithBalance) => void
  ) => {
    navigate(AppNavigation.Modal.SelectToken, {
      onTokenSelected: (token: TokenWithBalance) => {
        onTokenSelected(token as ERC20WithBalance)
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

  const onSuccess = (transactionId: string) => {
    navigation.popToTop()
    navigation.replace(AppNavigation.Send.Success, { transactionId })
  }

  return <ReviewSend onSuccess={onSuccess} />
}

type SuccessScreenProps = SendTokensScreenProps<
  typeof AppNavigation.Send.Success
>

const DoneScreenComponent = () => {
  const { goBack } = useNavigation<SuccessScreenProps['navigation']>()
  const { transactionId } = useRoute<SuccessScreenProps['route']>().params

  return (
    <DoneScreen onClose={() => goBack()} transactionId={transactionId ?? ''} />
  )
}

export default SendScreenStack
