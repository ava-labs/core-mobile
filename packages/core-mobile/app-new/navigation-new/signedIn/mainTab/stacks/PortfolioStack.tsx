import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import PortfolioHomeScreen from 'portfolio/screens/PortfolioHomeScreen'
import PortfolioAssetsScreen from 'portfolio/screens/PortfolioAssetsScreen'

const Stack = createStackNavigator<PortfolioStackParamList>()

const PortfolioStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PortfolioHomeScreen"
        component={PortfolioHomeScreen}
      />
      <Stack.Screen
        name="PortfolioAssetsScreen"
        component={PortfolioAssetsScreen}
      />
    </Stack.Navigator>
  )
}

export type PortfolioStackParamList = {
  PortfolioHomeScreen: undefined
  PortfolioAssetsScreen: undefined
}

export default PortfolioStack
