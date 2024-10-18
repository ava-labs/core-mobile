import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { modalScreensOptions } from 'navigation-new/utils/screenOptions'
import MainTab from './mainTab/MainTab'
import SettingsStack from './settings/SettingsStack'
import ReceiveStack from './receive/ReceiveStack'
import NotificationsStack from './notifications/NotificationsStack'

const Stack = createStackNavigator<SignedInStackParamList>()

const SignedInStack = (): JSX.Element => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTab" component={MainTab} />
      <Stack.Group screenOptions={modalScreensOptions}>
        {/* Modal stacks for signed in user. i.e., Send, Bridge, etc. */}
        <Stack.Screen name="SettingsStack" component={SettingsStack} />
        <Stack.Screen name="ReceiveStack" component={ReceiveStack} />
        <Stack.Screen
          name="NotificationsStack"
          component={NotificationsStack}
        />
      </Stack.Group>
    </Stack.Navigator>
  )
}

export type SignedInStackParamList = {
  MainTab: undefined
  SettingsStack: undefined
  ReceiveStack: undefined
  NotificationsStack: undefined
}

export default SignedInStack
