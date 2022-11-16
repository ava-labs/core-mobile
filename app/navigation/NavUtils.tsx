import { StackNavigationOptions } from '@react-navigation/stack'
import AvaText from 'components/AvaText'
import React from 'react'
import { View } from 'react-native'
import { Row } from 'components/Row'
import { AppTheme } from 'contexts/ApplicationContext'

export const BOTTOM_BAR_HEIGHT = 60

export const MainHeaderOptions = (
  title: string,
  hideHeaderLeft = false,
  actionComponent?: React.ReactNode
): Partial<StackNavigationOptions> => {
  return {
    headerShown: true,
    headerTitle: () => {
      return (
        <Row
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <AvaText.Heading1>{title}</AvaText.Heading1>
        </Row>
      )
    },
    headerTitleAlign: 'left',
    headerLeft: hideHeaderLeft ? () => null : undefined,
    headerBackTitleVisible: false,
    headerRight: actionComponent ? () => actionComponent : undefined,
    headerStyle: {
      shadowColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0
    }
  }
}

export const SubHeaderOptions = (
  title: string,
  hideHeaderLeft = false
): Partial<StackNavigationOptions> => {
  const options: Partial<StackNavigationOptions> = {
    headerShown: true,
    headerTitle: () => <AvaText.Heading2>{title}</AvaText.Heading2>,
    headerTitleAlign: 'center',
    headerLeft: hideHeaderLeft ? () => null : undefined,
    headerBackTitleVisible: false,
    headerStyle: {
      shadowColor: 'transparent',
      elevation: 0,
      shadowOpacity: 0
    }
  }

  return options
}

export const getCommonBottomTabOptions = (theme: AppTheme) => ({
  tabBarShowLabel: false,
  headerShown: true,
  tabBarAllowFontScaling: false,
  tabBarActiveTintColor: theme.colorPrimary1,
  tabBarInactiveTintColor: theme.colorText2,
  tabBarStyle: {
    backgroundColor: theme.background,
    height: BOTTOM_BAR_HEIGHT
  }
})

type NormalTabButtonParams = {
  theme: AppTheme
  routeName: string
  focused: boolean
  image: React.ReactNode
  testID?: string
}

/**
 * extracts creation of "normal" tab items
 * @param theme
 * @param routeName
 * @param focused
 * @param image
 */
export const normalTabButton = ({
  theme,
  routeName,
  focused,
  image
}: NormalTabButtonParams) => {
  return (
    <View style={{ justifyContent: 'center', alignItems: 'center', top: 2 }}>
      {image}
      <AvaText.Caption
        textStyle={{
          color: focused ? theme.alternateBackground : theme.colorIcon4
        }}
        testID="nav_utils__normal_tab_button">
        {routeName}
      </AvaText.Caption>
    </View>
  )
}
