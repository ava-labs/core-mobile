import { alpha, Icons, Pressable, Text, useTheme } from '@avalabs/k2-alpine'
import { colors } from '@avalabs/k2-alpine/src/theme/tokens/colors'
import { BottomTabBarProps } from '@bottom-tabs/react-navigation'
import { BlurViewWithFallback } from 'common/components/BlurViewWithFallback'
import { BottomTabs } from 'common/components/BottomTabs'
import { TAB_BAR_HEIGHT } from 'common/consts/screenOptions'
import React, { FC, useMemo } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'

const isIOS = Platform.OS === 'ios'

const portfolioIcon = require('../../../assets/icons/tabs/layers.png')
const trackIcon = require('../../../assets/icons/tabs/search-custom.png')
const stakeIcon = require('../../../assets/icons/tabs/psychiatry.png')
const browserIcon = require('../../../assets/icons/tabs/compass.png')
const activityIcon = require('../../../assets/icons/tabs/activity.png')

const tabLabelStyle = {
  fontSize: 10,
  fontFamily: isIOS ? undefined : 'Inter-Medium'
}

const tabBarInactiveTintOpacity = 0.6

/**
 * On Android, we enable freezeOnBlur to improve performance.
 * On iOS, it remains disabled since performance is already good.
 * Additionally, our testing showed that enabling freezeOnBlur on iOS
 * caused issues with SegmentedControl and the Browser tab.
 */
const freezeOnBlur = isIOS ? false : true

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
        ? alpha(colors.$neutral950, isIOS ? 0.8 : 1)
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
      tabBar={TabBar}
      tabLabelStyle={tabLabelStyle}>
      <BottomTabs.Screen
        name="portfolio"
        options={{
          tabBarButtonTestID: 'portfolio_tab',
          title: 'Portfolio',
          tabBarIcon: () => portfolioIcon,
          freezeOnBlur
        }}
      />
      <BottomTabs.Screen
        name="track"
        options={{
          tabBarButtonTestID: 'track_tab',
          title: 'Track',
          tabBarIcon: () => trackIcon,
          freezeOnBlur
        }}
      />
      <BottomTabs.Screen
        name="stake"
        options={{
          tabBarButtonTestID: 'stake_tab',
          title: 'Stake',
          tabBarIcon: () => stakeIcon,
          freezeOnBlur
        }}
      />
      <BottomTabs.Screen
        name="browser"
        options={{
          tabBarButtonTestID: 'browser_tab',
          title: 'Browser',
          tabBarIcon: () => browserIcon,
          freezeOnBlur
        }}
      />
      <BottomTabs.Screen
        name="activity"
        options={{
          tabBarButtonTestID: 'activity_tab',
          title: 'Activity',
          tabBarIcon: () => activityIcon,
          freezeOnBlur
        }}
      />
    </BottomTabs>
  )
}

const TabBar = ({
  state,
  descriptors,
  navigation
}: BottomTabBarProps): JSX.Element => {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()

  const backgroundColor = useMemo(() => {
    return theme.isDark
      ? isIOS
        ? alpha(colors.$neutral950, 0.8)
        : theme.colors.$surfacePrimary
      : alpha(theme.colors.$surfacePrimary, isIOS ? 0.8 : 1)
  }, [theme.colors.$surfacePrimary, theme.isDark])

  return (
    <BlurViewWithFallback
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingBottom: insets.bottom,
        backgroundColor,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor:
          Platform.OS === 'ios'
            ? theme.isDark
              ? '#333335'
              : '#F1F1F2'
            : 'transparent'
      }}>
      {state.routes.map((route, index) => {
        const isActive = state.index === index
        const Icon = getIcon(route.name)
        const title = descriptors[route.key]?.options?.title ?? route.name

        return (
          <Pressable
            key={index}
            onPress={() => {
              if (isActive) {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true
                })

                if (!event.defaultPrevented) {
                  navigation.navigate(route.name, route.params)
                }
              } else {
                navigation.navigate(route.name, route.params)
              }
            }}
            style={{
              opacity: isActive ? 1 : 0.6,
              paddingVertical: 12,
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              height: TAB_BAR_HEIGHT,
              gap: 4
            }}>
            <Icon color={theme.colors.$textPrimary} />
            <Text
              style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 10
              }}>
              {title}
            </Text>
          </Pressable>
        )
      })}
    </BlurViewWithFallback>
  )
}

function getIcon(name: string): FC<SvgProps> {
  switch (name) {
    case 'portfolio':
      return Icons.Navigation.Layers
    case 'track':
      return Icons.Navigation.Track
    case 'stake':
      return Icons.Navigation.Stake
    case 'browser':
      return Icons.Navigation.Browser
    case 'activity':
      return Icons.Navigation.History
    default:
      return Icons.Navigation.Layers
  }
}
