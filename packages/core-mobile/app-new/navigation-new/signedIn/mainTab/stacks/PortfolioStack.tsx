import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import PortfolioScreen from 'portfolio/screens/PortfolioScreen'
import PortfolioAssetsScreen from 'portfolio/screens/PortfolioAssetsScreen'

const Stack = createStackNavigator<PortfolioStackParamList>()

const PortfolioStack = (): JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PortfolioScreen" component={PortfolioScreen} />
      <Stack.Screen
        name="PortfolioAssetsScreen"
        component={PortfolioAssetsScreen}
      />
    </Stack.Navigator>
  )
}

export type PortfolioStackParamList = {
  PortfolioScreen: undefined
  PortfolioAssetsScreen: undefined
}

export default PortfolioStack
