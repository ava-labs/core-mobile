import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  createStackNavigator,
  TransitionPresets
} from '@react-navigation/stack'
import AppNavigation from 'navigation/AppNavigation'
import Buy from 'screens/rpc/buy/Buy'
import { SafeLowerAreaView } from 'components/SafeAreaViews'

export type BuyStackParamList = {
  [AppNavigation.Buy.Buy]: undefined
}

const BuyStack = createStackNavigator<BuyStackParamList>()

const BuyScreenStack = () => {
  const { theme } = useApplicationContext()

  return (
    <SafeLowerAreaView>
      <BuyStack.Navigator
        screenOptions={{
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
        <BuyStack.Screen name={AppNavigation.Buy.Buy} component={BuyScreen} />
      </BuyStack.Navigator>
    </SafeLowerAreaView>
  )
}

const BuyScreen = () => <Buy />

export default BuyScreenStack
