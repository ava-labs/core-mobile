import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import NotificationsScreen from 'notifications/screens/NotificationsScreen'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'navigation-new/utils/screenOptions'

const Stack = createStackNavigator<NotificationsStackParamList>()

const NotificationsStack = (): JSX.Element => {
  return (
    <Stack.Navigator screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen
        name="NotificationsScreen"
        options={modalFirstScreenOptions}
        component={NotificationsScreen}
      />
    </Stack.Navigator>
  )
}

export type NotificationsStackParamList = {
  NotificationsScreen: undefined
}

export default NotificationsStack
