import { alpha, Pressable, useTheme, View } from '@avalabs/k2-alpine'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Modal, Platform, ScrollView } from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Keyframe,
  type ReanimatedKeyframe,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import { MoreNavigationCard } from './MoreNavigationCard'
import { useMoreNavigationOverlayStore } from './store'

const TOP_PADDING = 50
const ENTERING_STAGGER_DELAY = 60
const EXIT_STAGGER_DELAY = 60

// Distance to drag before closing
const DISMISS_THRESHOLD = 80

// Entry keyframe: scale from 0.7 to 1 and fade in, anchored at bottom-left
const ENTER_DURATION = 400
const createEntryKeyframe = (delay: number): ReanimatedKeyframe =>
  new Keyframe({
    0: {
      opacity: 0,
      transform: [{ scale: 0.7 }]
    },
    70: {
      opacity: 1,
      transform: [{ scale: 1 }],
      easing: Easing.out(Easing.cubic)
    }
  })
    .duration(ENTER_DURATION)
    .delay(delay)

// Exit keyframe: lift up slightly, then slide down off-screen
const EXIT_DURATION = 500
const createExitKeyframe = (delay: number): ReanimatedKeyframe =>
  new Keyframe({
    0: { transform: [{ translateY: 0 }] },
    25: {
      transform: [{ translateY: -TOP_PADDING }],
      easing: Easing.out(Easing.cubic)
    },
    60: {
      transform: [{ translateY: 600 }],
      easing: Easing.in(Easing.cubic)
    }
  })
    .duration(EXIT_DURATION)
    .delay(delay)

const MoreNavigationOverlayContent = (): JSX.Element | null => {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const { isOpen, toggle, close } = useMoreNavigationOverlayStore()
  const [isVisible, setIsVisible] = useState(false)

  // Shared value tracking drag distance (0 = resting, positive = dragged down)
  const dragY = useSharedValue(0)
  // Whether we're actively dragging (disables the Keyframe exit animation)
  const isDragging = useSharedValue(false)
  // Whether closing was triggered by gesture (skip Keyframe exit)
  const gestureClose = useSharedValue(false)

  const items = useMemo(
    () => [
      {
        title: 'Chat',
        onPress: () => { }
      },
      {
        title: 'Prediction markets',
        onPress: () => { }
      },
      {
        title: 'Perpetual futures',
        onPress: () => { }
      },
      {
        title: 'Pay for everything on Avalanche',
        onPress: () => { }
      }
    ],
    []
  )

  // Estimated time for exit animation to finish + stagger
  const exitTotalMs =
    EXIT_DURATION + EXIT_STAGGER_DELAY * (items.length - 1) + 50

  const handleGestureClose = useCallback(() => {
    // Immediately hide the overlay — the gesture already animated it away,
    // so we skip the Keyframe exit animation
    setIsVisible(false)
    close()
  }, [close])

  const handleSnapBack = useCallback(() => {
    // no-op, just used as runOnJS target
  }, [])

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(20)
        .failOffsetX([-20, 20])
        .onStart(() => {
          isDragging.value = true
        })
        .onUpdate(event => {
          // Only allow dragging downward
          dragY.value = Math.max(0, event.translationY)
        })
        .onEnd(event => {
          const shouldClose =
            event.translationY > DISMISS_THRESHOLD || event.velocityY > 500

          if (shouldClose) {
            // Animate the panel off-screen, then close
            gestureClose.value = true
            dragY.value = withTiming(600, { duration: 300 }, () => {
              isDragging.value = false
              gestureClose.value = false
              // Close last — don't reset dragY here, it resets in useEffect on reopen
              runOnJS(handleGestureClose)()
            })
          } else {
            // Snap back to open position
            dragY.value = withTiming(0, { duration: 200 })
            isDragging.value = false
            runOnJS(handleSnapBack)()
          }
        }),
    [dragY, isDragging, gestureClose, handleGestureClose, handleSnapBack]
  )

  // Animated style for the bottom panel — follows the drag
  const panelAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: dragY.value }]
    }
  })

  // Animated style for the backdrop — fades out as user drags
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const progress = Math.min(dragY.value / DISMISS_THRESHOLD, 1)
    return {
      opacity: 1 - progress * 0.6
    }
  })

  const containerStyle = useAnimatedStyle(() => {
    const progress = Math.min(dragY.value / DISMISS_THRESHOLD, 1)
    return {
      opacity: withTiming(isOpen ? 1 - progress * 0.3 : 0, { duration: 300 })
    }
  })

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      dragY.value = 0
      gestureClose.value = false
    } else {
      // Keep the overlay mounted while items animate out
      const timeout = setTimeout(() => {
        setIsVisible(false)
      }, exitTotalMs)
      return () => clearTimeout(timeout)
    }
  }, [dragY, exitTotalMs, gestureClose, isOpen])

  const content = useMemo(
    () => (
      <>
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
          pointerEvents={isOpen ? 'auto' : 'none'}
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              zIndex: 1
            },
            backdropAnimatedStyle
          ]}>
          <Pressable
            onPress={toggle}
            style={{
              flex: 1
            }}
          />
        </Animated.View>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            pointerEvents={isOpen ? 'auto' : 'none'}
            style={[
              {
                position: 'absolute',
                bottom: 0,
                zIndex: 10,
                width: '100%'
              },
              panelAnimatedStyle
            ]}>
            <Animated.View
              style={[
                containerStyle,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }
              ]}>
              <LinearGradient
                colors={[
                  alpha(theme.colors.$surfacePrimary, 0),
                  alpha(theme.colors.$surfacePrimary, 0.8),
                  theme.colors.$surfacePrimary
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.6 }}
                style={{
                  height: 70
                }}
              />
              <View
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.$surfacePrimary
                }}
              />
            </Animated.View>
            <ScrollView
              horizontal
              contentContainerStyle={{
                paddingBottom: insets.bottom + 32,
                paddingHorizontal: 16,
                paddingTop: TOP_PADDING,
                gap: 12
              }}
              showsHorizontalScrollIndicator={false}>
              {items.map((item, index) => (
                <MoreNavigationCard
                  key={item.title}
                  item={item}
                  isOpen={isOpen}
                  index={index}
                  totalItems={items.length}
                  dragY={dragY}
                  entering={createEntryKeyframe(index * ENTERING_STAGGER_DELAY)}
                  exiting={createExitKeyframe(
                    (items.length - 1 - index) * EXIT_STAGGER_DELAY
                  )}
                />
              ))}
            </ScrollView>
          </Animated.View>
        </GestureDetector>
      </>
    ),
    [
      isOpen,
      backdropAnimatedStyle,
      toggle,
      panGesture,
      panelAnimatedStyle,
      containerStyle,
      theme.colors.$surfacePrimary,
      insets.bottom,
      items,
      dragY
    ]
  )

  if (!isVisible) return null
  if (Platform.OS === 'ios') {
    return <FullWindowOverlay>{content}</FullWindowOverlay>
  }

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none">
      <GestureHandlerRootView style={{ flex: 1 }}>
        {content}
      </GestureHandlerRootView>
    </Modal>
  )
}

export const MoreNavigationOverlay = MoreNavigationOverlayContent
