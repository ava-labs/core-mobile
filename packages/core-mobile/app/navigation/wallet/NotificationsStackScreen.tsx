import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { MainHeaderOptions } from 'navigation/NavUtils'
import { createStackNavigator } from '@react-navigation/stack'
import Notifications from 'screens/drawer/notifications/Notifications'
import { SafeLowerAreaView } from 'components/SafeAreaViews'

export type NotificationsStackParamList = {
  [AppNavigation.Notifications.Notifications]: undefined
}

const NotificationsStack = createStackNavigator<NotificationsStackParamList>()

const NotificationsStackScreen = () => {
  return (
    <SafeLowerAreaView>
      <NotificationsStack.Navigator
        screenOptions={{
          headerBackTitleVisible: false
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
    </SafeLowerAreaView>
  )
}

export default NotificationsStackScreen
