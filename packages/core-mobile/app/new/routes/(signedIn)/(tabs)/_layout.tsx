import { BottomTabBarProps } from '@bottom-tabs/react-navigation'
import { BottomTabs } from 'common/components/BottomTabs'

import { FC, useMemo } from 'react'

import {
  alpha,
  Icons,
  Pressable,
  Text,
  useKeyboardHeight,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { TAB_BAR_HEIGHT } from 'common/consts'
import React, { ReactNode, useCallback } from 'react'
import { Platform } from 'react-native'
import { SvgProps } from 'react-native-svg'

const isIOS = Platform.OS === 'ios'

enum TabName {
  Portfolio = 'Portfolio',
  Track = 'Track',
  Stake = 'Stake',
  Browser = 'Browser'
}

const TABS = [
  {
    title: TabName.Portfolio
  },
  {
    title: TabName.Track
  },
  {
    title: TabName.Stake
  },
  {
    title: TabName.Browser
  }
]

export default function TabLayout(): JSX.Element {
  const renderTabBar = useCallback((props: BottomTabBarProps) => {
    return <TabBar {...props} />
  }, [])

  return (
    <BottomTabs
      labeled
      translucent
      // on Android, page animations are disabled to improve performance.
      // on iOS, animations remain enabled as they are needed to fix the
      // BlurView rendering issue in the navigation header.
      disablePageAnimations={isIOS ? false : true}
      scrollEdgeAppearance={'default'}
      tabBar={renderTabBar}>
      {TABS.map(tab => (
        <BottomTabs.Screen
          key={tab.title.toLowerCase()}
          name={tab.title.toLowerCase()}
          options={{
            title: tab.title
          }}
        />
      ))}
    </BottomTabs>
  )
}

const TabBar = ({
  navigation,
  state,
  descriptors
}: BottomTabBarProps): ReactNode => {
  const keyboardHeight = useKeyboardHeight()
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()

  const backgroundColor = useMemo(() => {
    return theme.isDark
      ? isIOS
        ? '#181818'
        : '#1E1E24'
      : isIOS
      ? alpha(theme.colors.$white, 0.5)
      : theme.colors.$white
  }, [theme.isDark, theme.colors.$white])

  return (
    <View
      style={{
        height: TAB_BAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
        transform: [{ translateY: keyboardHeight > 0 ? TAB_BAR_HEIGHT : 0 }],
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor
      }}>
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key]
        if (!descriptor) return null

        const { options } = descriptor
        const isFocused = state.index === index
        const label = options.title || route.name
        const Icon = getTabIcon(label)

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isFocused ? 1 : 0.6,
              gap: 5
            }}>
            {Icon && (
              <Icon width={24} height={24} color={theme.colors.$textPrimary} />
            )}
            <Text
              variant="buttonMedium"
              style={{ fontSize: 10, lineHeight: 10 }}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function getTabIcon(name: string): FC<SvgProps> | null {
  switch (name) {
    case TabName.Portfolio:
      return Icons.Navigation.Layers
    case TabName.Track:
      return Icons.Navigation.Track
    case TabName.Stake:
      return Icons.Navigation.Stake
    case TabName.Browser:
      return Icons.Navigation.Browser
    default:
      return Icons.Custom.Compass
  }
}
