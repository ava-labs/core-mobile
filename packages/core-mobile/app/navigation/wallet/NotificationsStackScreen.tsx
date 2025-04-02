import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import Notifications from 'screens/drawer/notifications/Notifications'

export type NotificationsStackParamList = {
  [AppNavigation.Notifications.Notifications]: undefined
}

const NotificationsStack = createStackNavigator<NotificationsStackParamList>()

const NotificationsStackScreen = (): JSX.Element => {
  return (
    <NotificationsStack.Navigator
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal'
      }}>
      <NotificationsStack.Screen
        options={MainHeaderOptions({
          title: 'Notifications',
          headerBackTestID: 'header_back'
        })}
        name={AppNavigation.Notifications.Notifications}
        component={Notifications}
      />
    </NotificationsStack.Navigator>
  )
}

export default NotificationsStackScreen
