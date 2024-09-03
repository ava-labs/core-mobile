import React from 'react'
import AppNavigation from 'navigation/AppNavigation'
import Portfolio from 'screens/portfolio/home/Portfolio'
import NetworkTokens, {
  NetworkTokensTabs
} from 'screens/portfolio/network/NetworkTokens'
import { createStackNavigator } from '@react-navigation/stack'
import { PortfolioTabs } from 'consts/portfolio'
import { SafeLowerAreaView } from 'components/SafeAreaViews'

export type PortfolioStackParamList = {
  [AppNavigation.Portfolio.Portfolio]: { tabIndex?: PortfolioTabs }
  [AppNavigation.Portfolio.NetworkTokens]:
    | { tabIndex?: NetworkTokensTabs }
    | undefined
}

const PortfolioStack = createStackNavigator<PortfolioStackParamList>()

function PortfolioScreenStack(): JSX.Element {
  return (
    <SafeLowerAreaView>
      <PortfolioStack.Navigator
        screenOptions={{
          headerShown: false
        }}>
        <PortfolioStack.Screen
          name={AppNavigation.Portfolio.Portfolio}
          component={Portfolio}
        />
        <PortfolioStack.Screen
          name={AppNavigation.Portfolio.NetworkTokens}
          component={NetworkTokens}
        />
      </PortfolioStack.Navigator>
    </SafeLowerAreaView>
  )
}

export default React.memo(PortfolioScreenStack)
