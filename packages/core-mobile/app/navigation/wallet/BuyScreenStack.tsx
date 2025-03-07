import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import AppNavigation from 'navigation/AppNavigation'
import Buy from 'screens/rpc/buy/Buy'

export type BuyStackParamList = {
  [AppNavigation.Buy.Buy]: {
    showAvaxWarning?: boolean
  }
}

const BuyStack = createStackNavigator<BuyStackParamList>()

const BuyScreenStack = (): JSX.Element => {
  const { theme } = useApplicationContext()

  return (
    <BuyStack.Navigator
      screenOptions={{
        headerBackTestID: 'header_back',
        presentation: 'card',
        headerBackTitleVisible: false,
        headerTitleAlign: 'center',
        title: '',
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: theme.background
        },
        ...TransitionPresets.SlideFromRightIOS
      }}>
      <BuyStack.Screen name={AppNavigation.Buy.Buy} component={Buy} />
    </BuyStack.Navigator>
  )
}

export default BuyScreenStack
