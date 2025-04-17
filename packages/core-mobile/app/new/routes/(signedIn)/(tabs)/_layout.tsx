import { BottomTabs } from 'common/components/BottomTabs'
import { useMemo } from 'react'
import { alpha, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'
import { colors } from '@avalabs/k2-alpine/src/theme/tokens/colors'

const isIOS = Platform.OS === 'ios'

const portfolioIcon = require('../../../assets/icons/tabs/layers.png')
const trackIcon = require('../../../assets/icons/tabs/search-custom.png')
const stakeIcon = require('../../../assets/icons/tabs/psychiatry.png')
const browserIcon = require('../../../assets/icons/tabs/compass.png')

const tabLabelStyle = {
  fontSize: 10,
  fontFamily: 'Inter-Medium'
}

const tabBarInactiveTintOpacity = 0.6

export default function TabLayout(): JSX.Element {
  const { theme } = useTheme()

  const tabBarInactiveTintColor = useMemo(() => {
    return theme.isDark
      ? alpha(theme.colors.$white, tabBarInactiveTintOpacity)
      : alpha(colors.$neutral950, tabBarInactiveTintOpacity)
  }, [theme.colors.$white, theme.isDark])

  const tabBarStyle = useMemo(() => {
    return {
      backgroundColor: theme.isDark
        ? isIOS
          ? alpha(colors.$neutral950, 0.8)
          : colors.$neutral950
        : isIOS
        ? alpha(theme.colors.$white, 0.8)
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
