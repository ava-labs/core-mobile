import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import React from 'react'
import PortfolioStack from './stacks/PortfolioStack'
import TrackStack from './stacks/TrackStack'
import StakeStack from './stacks/StakeStack'
import ContactsStack from './stacks/ContactsStack'
import BrowserStack from './stacks/BrowserStack'

const Tab = createBottomTabNavigator<MainTabParamList>()

const MainTab = (): JSX.Element => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="PortfolioStack"
        options={{ title: 'Portfolio' }}
        component={PortfolioStack}
      />
      <Tab.Screen
        name="TrackStack"
        options={{ title: 'Track' }}
        component={TrackStack}
      />
      <Tab.Screen
        name="StakeStack"
        options={{ title: 'Stake' }}
        component={StakeStack}
      />
      <Tab.Screen
        name="ContactsStack"
        options={{ title: 'Contacts' }}
        component={ContactsStack}
      />
      <Tab.Screen
        name="BrowserStack"
        options={{ title: 'Browser' }}
        component={BrowserStack}
      />
    </Tab.Navigator>
  )
}

export type MainTabParamList = {
  PortfolioStack: undefined
  TrackStack: undefined
  StakeStack: undefined
  ContactsStack: undefined
  BrowserStack: undefined
}

export default MainTab
