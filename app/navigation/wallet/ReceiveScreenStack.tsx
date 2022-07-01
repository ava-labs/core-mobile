import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import AppNavigation from 'navigation/AppNavigation'
import ReceiveToken from 'screens/receive/ReceiveToken'
import TopNavigationHeader from 'navigation/TopNavigationHeader'

export type ReceiveStackParamList = {
  [AppNavigation.ReceiveTokens.ReceiveCChain]: undefined
}

const ReceiveStack = createStackNavigator<ReceiveStackParamList>()

const ReceiveScreenStack = () => {
  const { theme } = useApplicationContext()

  const receiveNavigator = (
    <ReceiveStack.Navigator
      screenOptions={{
        presentation: 'card',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: theme.background
        },
        ...TransitionPresets.SlideFromRightIOS
      }}>
      <ReceiveStack.Screen
        name={AppNavigation.ReceiveTokens.ReceiveCChain}
        options={{
          header: () => <TopNavigationHeader showBackButton />
        }}
        component={ReceiveTokenScreen}
      />
    </ReceiveStack.Navigator>
  )

  return receiveNavigator
}

const ReceiveTokenScreen = () => <ReceiveToken embedded={false} />

export default ReceiveScreenStack
