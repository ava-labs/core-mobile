import React from 'react'
import { alpha, useTheme } from '@avalabs/k2-alpine'
import { BottomTabs } from 'common/components/BottomTabs'

export default function TabLayout(): JSX.Element {
  const {
    theme: { colors, isDark }
  } = useTheme()

  return (
    <BottomTabs
      labeled
      translucent
      disablePageAnimations
      //activeIndicatorColor={'transparent'} // disable material's active indicator on Android
      tabBarActiveTintColor={isDark ? colors.$white : colors.$black}
      tabBarInactiveTintColor={
        isDark ? alpha(colors.$white, 0.6) : alpha('#1E1E24', 0.6)
      }
      tabBarStyle={{
        backgroundColor: isDark
          ? alpha('#1E1E24', 0.9)
          : alpha(colors.$white, 0.8)
      }}
      tabLabelStyle={{
        fontFamily: 'Inter-Bold',
        fontSize: 10
      }}>
      <BottomTabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: () => require('../../../assets/icons/tabs/layers.png')
        }}
      />
      <BottomTabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: () =>
            require('../../../assets/icons/tabs/search-custom.png')
        }}
      />
      <BottomTabs.Screen
        name="stake"
        options={{
          title: 'Stake',
          tabBarIcon: () => require('../../../assets/icons/tabs/psychiatry.png')
        }}
      />
      <BottomTabs.Screen
        name="browser"
        options={{
          title: 'Browser',
          tabBarIcon: () => require('../../../assets/icons/tabs/compass.png')
        }}
      />
    </BottomTabs>
  )
}
