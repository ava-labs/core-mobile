import {
  alpha,
  ANIMATED,
  Icons,
  Pressable,
  useKeyboardHeight,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { ReactNode, useState } from 'react'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'

import { BlurViewWithFallback } from 'common/components/BlurViewWithFallback'
import { LinearGradient } from 'expo-linear-gradient'
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

  const [isFocused, setIsFocused] = useState(false)

  const onCollapse = (): void => {
    inputRef?.current?.blur()
  }

  const historyStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        urlEntry?.length && isFocused ? 1 : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const favoritesStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(
        !urlEntry?.length && isFocused ? 1 : 0,
        ANIMATED.TIMING_CONFIG
      )
    }
  })

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withTiming(isFocused ? 1 : 0.9, ANIMATED.TIMING_CONFIG)
        }
      ]
    }
  })

  const focusStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 1 : 0, ANIMATED.TIMING_CONFIG)
    }
  })

  const inputContentStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFocused ? 0 : 1, ANIMATED.TIMING_CONFIG)
    }
  })

  return (
    <>
      {/* Pushes the input at the bottom for keyboard open positioning */}
      <View style={{ flex: 1 }} pointerEvents="none" />
      <Animated.View
        style={[
          {
            zIndex: 10,
            height: BROWSER_CONTROLS_HEIGHT,
            transform: [
              {
                translateY:
                  keyboardHeight > 0 ? 0 : -BROWSER_CONTROLS_HEIGHT - 10
              }
            ],
            backgroundColor: isFocused
              ? 'transparent'
              : alpha(theme.colors.$surfacePrimary, 0.6)
          }
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

      <View
        pointerEvents={isFocused ? 'auto' : 'none'}
        style={[
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
              backgroundColor: alpha(theme.colors.$surfacePrimary, 0.8),
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
            flex: 1,
            marginBottom: 30
          }}>
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
                  paddingTop: BROWSER_CONTROLS_HEIGHT + 44,
                  paddingBottom: insets.top
                }}
              />
            </Animated.View>
          )}
        </View>

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
            {
              position: 'absolute',
              top: insets.top,
              left: 0,
              right: 0,
              zIndex: 2,
              alignItems: 'center'
            }
          ]}>
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
        </Animated.View>
      </View>
    </>
  )
}
