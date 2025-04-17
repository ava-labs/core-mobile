import { BottomTabs } from 'common/components/BottomTabs'
import { useMemo } from 'react'
import { alpha, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'

const isIOS = Platform.OS === 'ios'

const portfolioIcon = require('../../../assets/icons/tabs/layers.png')
const trackIcon = require('../../../assets/icons/tabs/search-custom.png')
const stakeIcon = require('../../../assets/icons/tabs/psychiatry.png')
const browserIcon = require('../../../assets/icons/tabs/compass.png')

const tabLabelStyle = {
  fontFamily: isIOS ? 'Inter-SemiBold' : 'Inter-Bold',
  fontSize: 10
}

const tabBarInactiveTintOpacity = 0.4

export default function TabLayout(): JSX.Element {
  const { theme } = useTheme()

  const tabBarInactiveTintColor = useMemo(() => {
    return theme.isDark
      ? alpha(theme.colors.$white, tabBarInactiveTintOpacity)
      : alpha('#1E1E24', tabBarInactiveTintOpacity)
  }, [theme.colors.$white, theme.isDark])

  const tabBarStyle = useMemo(() => {
    return {
      backgroundColor: theme.isDark
        ? isIOS
          ? '#181818'
          : '#1E1E24'
        : isIOS
        ? alpha(theme.colors.$white, 0.5)
        : theme.colors.$white
    }
  }, [theme.colors.$white, theme.isDark])

  return (
    <BottomTabs
      labeled
      translucent
      // on Android, page animations are disabled to improve performance.
      // on iOS, animations remain enabled as they are needed to fix the
      // BlurView rendering issue in the navigation header.
      disablePageAnimations={isIOS ? false : true}
      tabBarActiveTintColor={theme.colors.$textPrimary}
      scrollEdgeAppearance={'default'}
      tabBarInactiveTintColor={tabBarInactiveTintColor}
      tabBarStyle={tabBarStyle}
      tabLabelStyle={tabLabelStyle}>
      <BottomTabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: () => portfolioIcon
        }}
      />
      <BottomTabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: () => trackIcon
        }}
      />
      <BottomTabs.Screen
        name="stake"
        options={{
          title: 'Stake',
          tabBarIcon: () => stakeIcon
        }}
      />
      <BottomTabs.Screen
        name="browser"
        options={{
          title: 'Browser',
          tabBarIcon: () => browserIcon
        }}
      />
    </BottomTabs>
  )
}
