import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { createStackNavigator } from '@react-navigation/stack'
import { useNavigation } from '@react-navigation/native'
import { SendContextProvider } from 'contexts/SendContext'
import FeatureBlocked from 'screens/posthog/FeatureBlocked'
import { SubHeaderOptions } from 'navigation/NavUtils'
import { useSelector } from 'react-redux'
import { selectIsSendBlocked } from 'store/posthog'
import { Contact } from '@avalabs/types'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import SendTokenScreen from 'screens/send/SendTokenScreen'

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
    <SendContextProvider>
      <SendStack.Navigator
        screenOptions={{
          headerShown: true,
          title: ''
        }}>
        <SendStack.Screen
          options={SubHeaderOptions('', false, 'header_back')}
          name={AppNavigation.Send.Send}
          component={SendTokenScreen}
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
    </SendContextProvider>
  )
}

export default SendScreenStack
