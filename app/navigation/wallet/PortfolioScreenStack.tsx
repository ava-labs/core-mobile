import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import PortfolioView from 'screens/portfolio/PortfolioView'
import { createStackNavigator } from '@react-navigation/stack'

export type PortfolioStackParamList = {
  [AppNavigation.Portfolio.Portfolio]: undefined
}

const PortfolioStack = createStackNavigator<PortfolioStackParamList>()

function PortfolioScreenStack() {
  return (
    <PortfolioStack.Navigator
      screenOptions={{
        headerShown: false
      }}>
      <PortfolioStack.Screen
        name={AppNavigation.Portfolio.Portfolio}
        component={PortfolioView}
      />
    </PortfolioStack.Navigator>
  )
}

export default React.memo(PortfolioScreenStack)
