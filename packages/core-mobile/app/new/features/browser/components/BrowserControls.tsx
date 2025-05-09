import {
  alpha,
  ANIMATED,
  Icons,
  Pressable,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { BlurViewWithFallback } from 'common/components/BlurViewWithFallback'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import { LinearGradient } from 'expo-linear-gradient'
import React, { ReactNode, useMemo } from 'react'
import { Platform } from 'react-native'
import { useBottomTabBarHeight } from 'react-native-bottom-tabs'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { KeyboardStickyView } from 'react-native-keyboard-controller'
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useBrowserContext } from '../BrowserContext'
import { BROWSER_CONTROLS_HEIGHT, HORIZONTAL_MARGIN } from '../consts'
import { BrowserInput } from './BrowserInput'
import { FavoritesList } from './FavoritesList'
import { HistoryList } from './HistoryList'

export const BrowserControls = (): ReactNode => {
  const { theme } = useTheme()
  const { inputRef, isRenameFavoriteVisible, showRecentSearches } =
    useBrowserContext()
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()

  const isFocused = useSharedValue(false)

  const gestureProgress = useSharedValue(0)

  const onCollapse = (): void => {
    inputRef?.current?.blur()
  }

  const onResetGestureProgress = (): void => {
    setTimeout(() => {
      gestureProgress.value = withTiming(0, ANIMATED.TIMING_CONFIG)
    }, 200)
  }

  const panGesture = Gesture.Pan()
    .onUpdate(event => {
      if (event.translationY > 0) {
        gestureProgress.value = Math.min(event.translationY / 100, 1)
      }
    })
    .onEnd(() => {
      if (gestureProgress.value > 0.3) {
        runOnJS(onCollapse)()
        gestureProgress.value = withTiming(1, ANIMATED.TIMING_CONFIG, () => {
          runOnJS(onResetGestureProgress)()
        })
      } else {
        gestureProgress.value = withTiming(0, ANIMATED.TIMING_CONFIG)
      }
    })

  const historyStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        showRecentSearches.value &&
          (isFocused.value || isRenameFavoriteVisible.value)
          ? 1 - gestureProgress.value
          : 0,
        ANIMATED.TIMING_CONFIG
      ),
      zIndex: showRecentSearches.value ? 1 : -1
    }
  })

  const favoritesStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        !showRecentSearches.value &&
          (isFocused.value || isRenameFavoriteVisible.value)
          ? 1 - gestureProgress.value
          : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(
            isFocused.value || isRenameFavoriteVisible.value
              ? 1 - gestureProgress.value * 0.1
              : 0.9,
            ANIMATED.TIMING_CONFIG
          )
        }
      ]
    }
  })

  const focusStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        isFocused.value || isRenameFavoriteVisible.value
          ? 1 - gestureProgress.value
          : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const gestureControlStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(
            gestureProgress.value * 100,
            ANIMATED.TIMING_CONFIG
          )
        }
      ]
    }
  })

  // mostly copied from routes/(signedIn)/(tabs)/_layout.tsx
  // as the background color of the browser controls
  // needs to match the background color of the bottom tab bar
  const backgroundColor = useMemo(() => {
    const isIOS = Platform.OS === 'ios'

    return theme.isDark
      ? alpha('#121213', isIOS ? 0.8 : 1)
      : alpha(theme.colors.$white, isIOS ? 0.8 : 1)
  }, [theme.isDark, theme.colors.$white])

  const browserInputStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: isFocused.value ? 'transparent' : backgroundColor
    }
  })

  const contentStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: isFocused.value ? 'auto' : 'none',
      zIndex: isFocused.value ? 10 : -1
    }
  })

  return (
    <>
      <KeyboardStickyView
        style={{
          zIndex: 11
        }}
        offset={{ opened: tabBarHeight, closed: 0 }}>
        <Animated.View
          style={[
            browserInputStyle,
            {
              padding: HORIZONTAL_MARGIN,
              paddingVertical: 12
            }
          ]}>
          <BrowserInput
            isFocused={isFocused}
            setIsFocused={value => (isFocused.value = value)}
          />
        </Animated.View>
      </KeyboardStickyView>

      <Animated.View
        style={[
          contentStyle,
          {
            flex: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }
        ]}>
        <Animated.View
          style={[
            focusStyle,
            {
              position: 'absolute',
              backgroundColor: alpha(theme.colors.$surfacePrimary, 0.6),
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }
          ]}>
          <BlurViewWithFallback
            style={{
              flex: 1
            }}
          />
        </Animated.View>

        <KeyboardAvoidingView>
          <Animated.View
            style={[
              gestureControlStyle,
              {
                flex: 1,
                marginBottom: 24
              }
            ]}>
            <Animated.View
              style={[
                favoritesStyle,
                scaleStyle,
                {
                  flex: 1
                }
              ]}>
              <FavoritesList
                contentContainerStyle={{
                  paddingTop: insets.top + 50,
                  paddingBottom: insets.top
                }}
              />
            </Animated.View>
            <Animated.View
              style={[
                historyStyle,
                scaleStyle,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }
              ]}>
              <HistoryList
                contentContainerStyle={{
                  paddingTop: 30,
                  paddingBottom: BROWSER_CONTROLS_HEIGHT
                }}
              />
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>

        <Animated.View
          pointerEvents="none"
          style={[
            focusStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1
            }
          ]}>
          <LinearGradient
            style={{
              height: insets.top + 100
            }}
            colors={[
              theme.colors.$surfacePrimary,
              alpha(theme.colors.$surfacePrimary, 0)
            ]}
            start={{
              x: 0,
              y: 0
            }}
            end={{
              x: 0,
              y: 1
            }}
          />
        </Animated.View>

        <Animated.View
          pointerEvents={'box-none'}
          style={[
            focusStyle,
            gestureControlStyle,
            {
              position: 'absolute',
              top: insets.top,
              left: 0,
              right: 0,
              zIndex: 2
            }
          ]}>
          <GestureDetector gesture={panGesture}>
            <Pressable onPress={onCollapse}>
              <View
                style={{
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                <Icons.Custom.ArrowDownHandleBar
                  color={theme.colors.$textSecondary}
                  width={40}
                />
              </View>
            </Pressable>
          </GestureDetector>
        </Animated.View>
      </Animated.View>
    </>
  )
}
