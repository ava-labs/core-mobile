import {
  alpha,
  BlurViewWithFallback,
  Icons,
  Pressable,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { colors } from '@avalabs/k2-alpine/src/theme/tokens/colors'
import { BottomTabBarProps } from '@bottom-tabs/react-navigation'
import { BottomTabs } from 'common/components/BottomTabs'
import { LinearGradientBottomWrapper } from 'common/components/LinearGradientBottomWrapper'
import { TAB_BAR_HEIGHT } from 'common/consts/screenOptions'
import { useHasXpAddresses } from 'common/hooks/useHasXpAddresses'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { Platform, ScrollView, StyleSheet } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import { SvgProps } from 'react-native-svg'
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
const earnPngIcon = require('../../../assets/icons/tabs/whatshot.png')

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

  // Show 'Earn' title only when: borrow disabled + DeFi enabled (existing behavior)
  const stakeTabTitle =
    isInAppDefiBorrowBlocked && !isInAppDefiBlocked ? 'Earn' : 'Stake'

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
          tabBarIcon: () => earnPngIcon,
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
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const backgroundColor = useMemo(() => {
    return theme.isDark
      ? isIOS
        ? alpha(colors.$neutral950, 0.8)
        : theme.colors.$surfacePrimary
      : alpha(theme.colors.$surfacePrimary, isIOS ? 0.8 : 1)
  }, [theme.colors.$surfacePrimary, theme.isDark])

  const onToggleMore = (): void => {
    setIsMoreOpen(!isMoreOpen)
  }

  return (
    <View>
      <BottomSheet isOpen={isMoreOpen} onToggle={onToggleMore} />
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
          const Icon = getIcon(route.name)
          const title = options?.title ?? route.name

          return (
            <TabItem
              index={index}
              isActive={isActive}
              Icon={Icon}
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
              title={title}
            />
          )
        })}
        <TabItem
          index={state.routes.length + 1}
          isActive={false}
          Icon={Icons.Navigation.Check}
          onPress={onToggleMore}
          title="More"
        />
      </BlurViewWithFallback>
    </View>
  )
}

const TabItem = ({
  index,
  isActive,
  title,
  Icon,
  onPress
}: {
  index: number
  isActive: boolean
  title: string
  Icon: FC<SvgProps>
  onPress: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <Pressable
      key={index}
      onPress={onPress}
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
        testID={`${title}_tab`}
        style={{
          fontFamily: 'Inter-SemiBold',
          fontSize: 10
        }}>
        {title}
      </Text>
    </Pressable>
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
    case 'earn':
      return Icons.Navigation.Earn
    case 'browser':
      return Icons.Navigation.Browser
    case 'activity':
      return Icons.Navigation.History
    case 'more':
      return Icons.Navigation.Check
    default:
      return Icons.Navigation.Layers
  }
}

const ITEMS = [1, 2, 3]
const EXIT_ANIMATION_DURATION = 300
const EXIT_STAGGER_DELAY = 40
// Total time needed for all exit animations to finish before unmounting
const EXIT_TOTAL_MS =
  EXIT_ANIMATION_DURATION + EXIT_STAGGER_DELAY * (ITEMS.length - 1) + 50

const BottomSheet = ({
  isOpen,
  onToggle
}: {
  isOpen: boolean
  onToggle: () => void
}): JSX.Element | null => {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      // Keep the overlay mounted while items animate out
      const timeout = setTimeout(() => {
        setIsVisible(false)
      }, EXIT_TOTAL_MS)
      return () => clearTimeout(timeout)
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <FullWindowOverlay>
      <Animated.View
        entering={FadeIn.duration(250)}
        exiting={FadeOut.duration(200)}
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 1
        }}>
        <Pressable
          onPress={onToggle}
          style={{
            flex: 1,
            backgroundColor: 'red'
          }}
        />
      </Animated.View>
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          bottom: 0,
          minHeight: 300,
          zIndex: 10,
          width: '100%'
        }}>
        <ScrollView
          horizontal
          contentContainerStyle={{
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: 16,
            paddingTop: 16,
            gap: 20
          }}
          showsHorizontalScrollIndicator={false}>
          {isOpen &&
            ITEMS.map((item, index) => (
              <Animated.View
                key={item}
                entering={SlideInDown.duration(400).delay(index * 60)}
                exiting={SlideOutDown.duration(EXIT_ANIMATION_DURATION).delay(
                  (ITEMS.length - 1 - index) * EXIT_STAGGER_DELAY
                )}
                style={{
                  width: 200,
                  height: 260,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.$borderPrimary,
                  backgroundColor: theme.colors.$surfaceSecondary,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                <Text>{item}</Text>
              </Animated.View>
            ))}
        </ScrollView>
      </Animated.View>
    </FullWindowOverlay>
  )
}
