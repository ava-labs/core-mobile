import { Tabs } from 'expo-router'
import React from 'react'

import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false
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
