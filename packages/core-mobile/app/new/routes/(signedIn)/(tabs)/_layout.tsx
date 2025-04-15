import React, { useMemo } from 'react'
import { alpha, useTheme } from '@avalabs/k2-alpine'
import { Platform } from 'react-native'
import { BottomTabs } from 'common/components/BottomTabs'

const portfolioIcon = require('../../../assets/icons/tabs/layers.png')
const trackIcon = require('../../../assets/icons/tabs/search-custom.png')
const stakeIcon = require('../../../assets/icons/tabs/psychiatry.png')
const browserIcon = require('../../../assets/icons/tabs/compass.png')

const isIOS = Platform.OS === 'ios'

const tabLabelStyle = {
  fontFamily: isIOS ? 'Inter-Medium' : 'Inter-Bold',
  fontSize: 10
}

const tabBarInactiveTintOpacity = 0.4

export default function TabLayout(): JSX.Element {
  const {
    theme: { colors, isDark }
  } = useTheme()

  const tabBarInactiveTintColor = useMemo(() => {
    return isDark
      ? alpha(colors.$white, tabBarInactiveTintOpacity)
      : alpha('#1E1E24', tabBarInactiveTintOpacity)
  }, [colors.$white, isDark])

  const tabBarStyle = useMemo(() => {
    return {
      backgroundColor: isDark
        ? isIOS
          ? alpha(colors.$black, 0.88)
          : '#1E1E24'
        : isIOS
        ? alpha(colors.$white, 0.5)
        : colors.$white
    }
  }, [colors.$white, colors.$black, isDark])

  return (
    <BottomTabs
      labeled
      translucent
      // on Android, page animations are disabled to improve performance.
      // on iOS, animations remain enabled as they are needed to fix the
      // BlurView rendering issue in the navigation header.
      disablePageAnimations={isIOS ? false : true}
      tabBarActiveTintColor={isDark ? colors.$white : colors.$black}
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
