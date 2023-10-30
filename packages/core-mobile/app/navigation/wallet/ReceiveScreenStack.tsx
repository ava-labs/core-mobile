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

  return (
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
          header: TopNavigation
        }}
        component={ReceiveTokenScreen}
      />
    </ReceiveStack.Navigator>
  )
}

const ReceiveTokenScreen = () => <ReceiveToken embedded={false} />
const TopNavigation = () => <TopNavigationHeader showBackButton />

export default ReceiveScreenStack
