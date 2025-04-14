import { Tabs } from 'expo-router'
import React, { useCallback } from 'react'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import { alpha, Icons, useTheme } from '@avalabs/k2-alpine'
import { Platform } from 'react-native'

export default function TabLayout(): JSX.Element {
  const { theme } = useTheme()
  const backgroundColor = alpha(theme.colors.$surfacePrimary, 0.6)
  const tabBarBackground = useCallback(
    () => <BlurredBackgroundView backgroundColor={backgroundColor} />,
    [backgroundColor]
  )

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarBackground,
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold'
        },
        tabBarStyle: {
          position: 'absolute'
        }
      }}>
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: PortfolioTabBarIcon
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: TrackTabBarIcon
        }}
      />
      <Tabs.Screen
        name="stake"
        options={{
          title: 'Stake',
          tabBarIcon: StakeTabBarIcon
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: 'Browser',
          tabBarIcon: BrowserTabBarIcon
        }}
      />
    </Tabs>
  )
}

const PortfolioTabBarIcon = ({ color }: { color: string }): JSX.Element => (
  <Icons.Maps.Layer testID="portfolio_tab" color={color} />
)

const TrackTabBarIcon = ({ color }: { color: string }): JSX.Element => (
  <Icons.Custom.SearchCustom testID="track_tab" color={color} />
)

const StakeTabBarIcon = ({ color }: { color: string }): JSX.Element => (
  <Icons.Custom.Psychiatry testID="stake_tab" color={color} />
)

const BrowserTabBarIcon = ({ color }: { color: string }): JSX.Element => (
  <Icons.Custom.Compass testID="browser_tab" color={color} />
)
