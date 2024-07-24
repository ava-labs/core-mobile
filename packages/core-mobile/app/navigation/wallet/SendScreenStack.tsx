import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import SendToken from 'screens/send/SendToken'
import { useNavigation, useRoute } from '@react-navigation/native'
import { SendTokenContextProvider } from 'contexts/SendTokenContext'
import { SendTokensScreenProps } from 'navigation/types'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { TokenWithBalance } from 'store/balance/types'
import { SubHeaderOptions } from 'navigation/NavUtils'
import { useSelector } from 'react-redux'
import { selectIsSendBlocked } from 'store/posthog'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { Contact } from '@avalabs/types'

export type SendStackParamList = {
  [AppNavigation.Send.Send]:
    | { token?: TokenWithBalance; contact?: Contact }
    | undefined
}

const SendStack = createStackNavigator<SendStackParamList>()

function SendScreenStack(): JSX.Element {
  const isSendBlocked = useSelector(selectIsSendBlocked)
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
      </SendStack.Navigator>
      {isSendBlocked && (
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

const SendTokenComponent = (): JSX.Element => {
  const { navigate } = useNavigation<SendScreenProps['navigation']>()
  const { params } = useRoute<SendScreenProps['route']>()

  const onOpenSelectToken = (
    onTokenSelected: (token: TokenWithBalance) => void
  ): void => {
    navigate(AppNavigation.Modal.SelectToken, {
      onTokenSelected: (token: TokenWithBalance) => {
        onTokenSelected(token)
        AnalyticsService.capture('Send_TokenSelected')
      }
    })
  }

  return (
    <SendToken
      contact={params?.contact}
      token={params?.token}
      onOpenAddressBook={() => navigate(AppNavigation.Wallet.AddressBook)}
      onOpenSelectToken={onOpenSelectToken}
    />
  )
}

export default SendScreenStack
