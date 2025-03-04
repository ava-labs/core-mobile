import { Tabs } from 'expo-router'
import React, { useCallback } from 'react'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import { Icons } from '@avalabs/k2-alpine'

export default function TabLayout(): JSX.Element {
  const tabBarBackground = useCallback(() => <BlurredBackgroundView />, [])

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
  <Icons.Maps.Layer color={color} />
)

const TrackTabBarIcon = ({ color }: { color: string }): JSX.Element => (
  <Icons.Custom.SearchCustom color={color} />
)

const StakeTabBarIcon = ({ color }: { color: string }): JSX.Element => (
  <Icons.Custom.Psychiatry color={color} />
)

const BrowserTabBarIcon = ({ color }: { color: string }): JSX.Element => (
  <Icons.Custom.Compass color={color} />
)
