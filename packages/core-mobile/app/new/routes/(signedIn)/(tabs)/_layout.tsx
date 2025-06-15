import { alpha, useTheme } from '@avalabs/k2-alpine'
import { BottomTabs } from 'common/components/BottomTabs'
import React, { useMemo } from 'react'
import { Platform } from 'react-native'

const isIOS = Platform.OS === 'ios'

const portfolioIcon = require('../../../assets/icons/tabs/layers.png')
const trackIcon = require('../../../assets/icons/tabs/search-custom.png')
const stakeIcon = require('../../../assets/icons/tabs/psychiatry.png')
const browserIcon = require('../../../assets/icons/tabs/compass.png')

const tabLabelStyle = {
  fontSize: 10,
  fontFamily: isIOS ? undefined : 'Inter-Medium'
}

const tabBarInactiveTintOpacity = 0.6

export default function TabLayout(): JSX.Element {
  const { theme } = useTheme()

  const tabBarInactiveTintColor = useMemo(() => {
    return theme.isDark
      ? alpha(theme.colors.$white, tabBarInactiveTintOpacity)
      : alpha('#121213', tabBarInactiveTintOpacity)
  }, [theme.colors.$white, theme.isDark])

  const tabBarStyle = useMemo(() => {
    return {
      backgroundColor: theme.isDark
        ? alpha('#121213', isIOS ? 0.8 : 1)
        : alpha(theme.colors.$white, isIOS ? 0.8 : 1)
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
          tabBarButtonTestID: 'portfolio_tab',
          title: 'Portfolio',
          tabBarIcon: () => portfolioIcon
        }}
      />
      <BottomTabs.Screen
        name="track"
        options={{
          tabBarButtonTestID: 'track_tab',
          title: 'Track',
          tabBarIcon: () => trackIcon
        }}
      />
      <BottomTabs.Screen
        name="stake"
        options={{
          tabBarButtonTestID: 'stake_tab',
          title: 'Stake',
          tabBarIcon: () => stakeIcon
        }}
      />
      <BottomTabs.Screen
        name="browser"
        options={{
          tabBarButtonTestID: 'browser_tab',
          title: 'Browser',
          tabBarIcon: () => browserIcon
        }}
      />
    </BottomTabs>
  )
}
