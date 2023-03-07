import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import AppNavigation from 'navigation/AppNavigation'
import TopNavigationHeader from 'navigation/TopNavigationHeader'
import Buy from 'screens/rpc/buy/Buy'

export type BuyStackParamList = {
  [AppNavigation.Wallet.Buy]: undefined
}

const BuyStack = createStackNavigator<BuyStackParamList>()

const BuyScreenStack = () => {
  const { theme } = useApplicationContext()

  const receiveNavigator = (
    <BuyStack.Navigator
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
      <BuyStack.Screen
        name={AppNavigation.Wallet.Buy}
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          header: () => <TopNavigationHeader showBackButton />
        }}
        component={BuyScreen}
      />
    </BuyStack.Navigator>
  )

  return receiveNavigator
}

const BuyScreen = () => <Buy />

export default BuyScreenStack
