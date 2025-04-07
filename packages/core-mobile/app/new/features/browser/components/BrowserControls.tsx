import {
  alpha,
  ANIMATED,
  Icons,
  Pressable,
  useKeyboardHeight,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { BlurViewWithFallback } from 'common/components/BlurViewWithFallback'
import { LinearGradient } from 'expo-linear-gradient'
import React, { ReactNode, useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
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
  const { urlEntry, inputRef } = useBrowserContext()
  const insets = useSafeAreaInsets()
  const keyboardHeight = useKeyboardHeight()
  const tabBarHeight = useBottomTabBarHeight()

  const [isFocused, setIsFocused] = useState(false)
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
        urlEntry?.length && isFocused ? 1 - gestureProgress.value : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const favoritesStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        !urlEntry?.length && isFocused ? 1 - gestureProgress.value : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(
            isFocused ? 1 - gestureProgress.value * 0.1 : 0.9,
            ANIMATED.TIMING_CONFIG
          )
        }
      ]
    }
  })

  const focusStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        isFocused ? 1 - gestureProgress.value : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const inputContentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 0 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  const inputKeyboardPositioning = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(keyboardHeight > 0 ? 0 : -tabBarHeight + 1, {
            ...ANIMATED.TIMING_CONFIG,
            duration: 10
          })
        }
      ]
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

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 11
        }}>
        <Animated.View
          style={[
            inputKeyboardPositioning,
            [
              {
                zIndex: 11,
                height: BROWSER_CONTROLS_HEIGHT,
                backgroundColor: isFocused
                  ? 'transparent'
                  : alpha(theme.colors.$surfacePrimary, 0.6)
              }
            ]
          ]}>
          <Animated.View
            style={[
              inputContentStyle,
              {
                position: 'absolute',
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

          <View
            style={{
              padding: HORIZONTAL_MARGIN
            }}>
            <BrowserInput isFocused={isFocused} setIsFocused={setIsFocused} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      <View
        pointerEvents={isFocused ? 'auto' : 'none'}
        style={[
          {
            flex: 1,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1
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

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <Animated.View
            style={[
              gestureControlStyle,
              {
                flex: 1,
                marginBottom: 30
              }
            ]}>
            {urlEntry.length ? (
              <Animated.View
                pointerEvents={urlEntry.length ? 'auto' : 'none'}
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
            ) : (
              <Animated.View
                pointerEvents={urlEntry.length ? 'none' : 'auto'}
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
            )}
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
              zIndex: 2,
              alignItems: 'center'
            }
          ]}>
          <GestureDetector gesture={panGesture}>
            <Pressable
              onPress={onCollapse}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              <Icons.Custom.ArrowDownHandleBar
                color={theme.colors.$textSecondary}
                width={40}
              />
            </Pressable>
          </GestureDetector>
        </Animated.View>
      </View>
    </>
  )
}
