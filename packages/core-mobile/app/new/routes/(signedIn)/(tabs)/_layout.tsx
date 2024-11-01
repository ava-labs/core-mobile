import { Tabs } from 'expo-router'
import React, { useCallback } from 'react'
import BlurredBackgroundView from 'new/components/navigation/BlurredBackgroundView'

export default function TabLayout(): JSX.Element {
  const tabBarBackground = useCallback(() => <BlurredBackgroundView />, [])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground,
        tabBarStyle: {
          position: 'absolute'
        }
      }}>
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio'
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track'
        }}
      />
      <Tabs.Screen
        name="stake"
        options={{
          title: 'Stake'
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts'
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: 'Browser'
        }}
      />
    </Tabs>
  )
}
