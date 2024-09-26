import {
  createMaterialTopTabNavigator,
  MaterialTopTabBar,
  MaterialTopTabBarProps
} from '@react-navigation/material-top-tabs'
import React from 'react'
import { useTheme, View } from '@avalabs/k2-mobile'
import { Dimensions } from 'react-native'
import { PortfolioTabs } from 'consts/portfolio'

export const Tab = createMaterialTopTabNavigator()

export type TabScreens = { name: PortfolioTabs; component: React.FC }[]

export const TabView = ({
  currenTabName,
  tabScreens,
  onPress,
  renderCustomLabel,
  hideSingleTab = true,
  testID,
  lazy
}: {
  lazy?: boolean
  testID?: string
  hideSingleTab?: boolean
  currenTabName?: PortfolioTabs
  tabScreens: TabScreens
  onPress?: (name: PortfolioTabs) => void
  renderCustomLabel?: (props: {
    focused: boolean
    color: string
    children: string
  }) => React.ReactNode
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <Tab.Navigator
      tabBar={renderCustomMaterialTopTabBar}
      testID={testID}
      initialRouteName={currenTabName}
      initialLayout={{ width: Dimensions.get('window').width }}
      screenOptions={{
        tabBarActiveTintColor: colors.$white,
        tabBarInactiveTintColor: colors.$white,
        tabBarIndicatorStyle: {
          backgroundColor: colors.$blueMain,
          height: 2,
          marginBottom: 1
        },
        tabBarStyle: {
          display: tabScreens.length <= 1 && hideSingleTab ? 'none' : 'flex',
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: colors.$transparent,
          marginHorizontal: 16
        },
        tabBarLabel: renderCustomLabel,
        lazy
      }}>
      {tabScreens.map(screen => {
        return (
          <Tab.Screen
            key={screen.name.toLowerCase()}
            name={screen.name}
            component={screen.component}
            listeners={({ route }) => ({
              swipeEnd: () => onPress?.(route.name),
              tabPress: () => onPress?.(route.name)
            })}
          />
        )
      })}
    </Tab.Navigator>
  )
}

const renderCustomMaterialTopTabBar = (
  props: MaterialTopTabBarProps
): React.JSX.Element => {
  return (
    <>
      <MaterialTopTabBar {...props} />
      <View
        sx={{
          borderBottomColor: '$neutral800',
          borderBottomWidth: 1
        }}
      />
    </>
  )
}
