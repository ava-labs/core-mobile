import {
  alpha,
  BlurViewWithFallback,
  Pressable,
  Text,
  useTheme
} from '@avalabs/k2-alpine'
import { colors } from '@avalabs/k2-alpine/src/theme/tokens/colors'
import { BottomTabBarProps } from '@bottom-tabs/react-navigation'
import { BottomTabs } from 'common/components/BottomTabs'
import { TAB_BAR_HEIGHT } from 'common/consts/screenOptions'
import { useHasXpAddresses } from 'common/hooks/useHasXpAddresses'
import React, { useMemo } from 'react'
import { Image, ImageSourcePropType, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import {
  selectIsInAppDefiBlocked,
  selectIsInAppDefiBorrowBlocked
} from 'store/posthog'

const isIOS = Platform.OS === 'ios'

const portfolioIcon = require('../../../assets/icons/tabs/layers.png')
const trackIcon = require('../../../assets/icons/tabs/search-custom.png')
const stakeIcon = require('../../../assets/icons/tabs/psychiatry.png')
const browserIcon = require('../../../assets/icons/tabs/compass.png')
const activityIcon = require('../../../assets/icons/tabs/activity.png')
const earnIcon = require('../../../assets/icons/tabs/whatshot.png')

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
  const hasXpAddresses = useHasXpAddresses()

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
  const isInAppDefiBlocked = useSelector(selectIsInAppDefiBlocked)
  const isInAppDefiBorrowBlocked = useSelector(selectIsInAppDefiBorrowBlocked)

  // When borrow feature is enabled, show separate Stake and Earn tabs
  // When borrow feature is disabled, use existing behavior (Stake or Earn based on DeFi flag)
  const stakeTabTitle = isInAppDefiBorrowBlocked
    ? isInAppDefiBlocked
      ? 'Stake'
      : 'Earn'
    : 'Stake'

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
      {hasXpAddresses && (
        <BottomTabs.Screen
          name="stake"
          options={{
            tabBarButtonTestID: 'stake_tab',
            title: stakeTabTitle,
            tabBarIcon: () => stakeIcon,
            freezeOnBlur
          }}
        />
      )}
      <BottomTabs.Screen
        name="earn"
        options={{
          tabBarButtonTestID: 'earn_tab',
          title: 'Earn',
          tabBarIcon: () => earnIcon,
          freezeOnBlur,
          // Hide when borrow feature is disabled
          tabBarItemHidden: isInAppDefiBorrowBlocked
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
          freezeOnBlur,
          // Hide when borrow feature is enabled (Activity moves to Portfolio sub-tab)
          tabBarItemHidden: !isInAppDefiBorrowBlocked
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
  const hasXpAddresses = useHasXpAddresses()
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
        const options = descriptors[route.key]?.options
        // Check tabBarItemHidden option
        if (options?.tabBarItemHidden) {
          return null
        }
        // Hide stake/earn tabs when user doesn't have XP addresses
        if (
          (route.name === 'stake' || route.name === 'earn') &&
          !hasXpAddresses
        ) {
          return null
        }
        const isActive = state.index === index
        const title = options?.title ?? route.name
        const icon = options?.tabBarIcon?.({
          focused: isActive
        }) as ImageSourcePropType | undefined

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
            {icon && (
              <Image
                source={icon}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: theme.colors.$textPrimary
                }}
              />
            )}
            <Text
              testID={`${title}_tab`}
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
