import { Tabs } from 'expo-router'
import React, { useCallback } from 'react'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import { Icons, useTheme } from '@avalabs/k2-alpine'

export default function TabLayout(): JSX.Element {
  const {
    theme: { isDark }
  } = useTheme()
  const backgroundColor = isDark ? '#1E1E2499' : '#FFFFFFCC'
  const tabBarBackground = useCallback(
    () => <BlurredBackgroundView backgroundColor={backgroundColor} />,
    [backgroundColor]
  )

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
