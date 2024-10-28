import TabBarBackground from 'new/components/navigation/TabBarBackground'
import { Tabs } from 'expo-router'
import React, { useCallback } from 'react'

export default function TabLayout(): JSX.Element {
  const tabBarBackground = useCallback(() => <TabBarBackground />, [])

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
