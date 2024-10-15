import { Tabs } from 'expo-router'
import React from 'react'

export default function TabLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={{
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
