import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React, { useEffect, useRef, useState } from 'react'
import { View } from '@avalabs/k2-alpine'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  SharedValue,
  clamp
} from 'react-native-reanimated'
/**
 * Temporarily import "useNavigation" from @react-navigation/native.
 * This is a workaround due to a render bug in the expo-router version.
 * See: https://github.com/expo/expo/issues/35383
 * TODO: Adjust import back to expo-router once the bug is resolved.
 */
import { useNavigation } from '@react-navigation/native'

export const useFadingHeaderNavigation = ({
  header,
  targetLayout,
  shouldHeaderHaveGrabber = false,
  hasSeparator = true
}: {
  header?: JSX.Element
  targetLayout?: LayoutRectangle
  shouldHeaderHaveGrabber?: boolean
  hasSeparator?: boolean
}): {
  onScroll: (
    event: NativeSyntheticEvent<NativeScrollEvent> | NativeScrollEvent | number
  ) => void
  scrollEventThrottle: number
  targetHiddenProgress: SharedValue<number>
} => {
  const navigation = useNavigation()
  const [navigationHeaderLayout, setNavigationHeaderLayout] = useState<
    LayoutRectangle | undefined
  >(undefined)

  const targetHiddenProgress = useSharedValue(0) // from 0 to 1, 0 = fully hidden, 1 = fully shown

  // Ensures `handleScroll`, even when called inside `runJS`, always accesses
  // the latest `targetLayout`. Using a ref prevents stale values from being
  // captured in `useCallback` and keeps the layout data up to date.
  const targetLayoutRef = useRef(targetLayout)
  useEffect(() => {
    targetLayoutRef.current = targetLayout
  }, [targetLayout])

  const handleLayout = (event: LayoutChangeEvent): void => {
    setNavigationHeaderLayout(event.nativeEvent.layout)
  }

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent> | NativeScrollEvent | number
  ): void => {
    let contentOffsetY: number | undefined

    if (typeof event === 'number') {
      // If event is just a numeric value, use it directly
      contentOffsetY = event
    } else if ('nativeEvent' in event) {
      // If event is a NativeSyntheticEvent<NativeScrollEvent>
      contentOffsetY = event.nativeEvent.contentOffset.y
    } else {
      // If event is a NativeScrollEvent
      contentOffsetY = event.contentOffset.y
    }

    const latestTargetLayout = targetLayoutRef.current

    if (latestTargetLayout && contentOffsetY !== undefined) {
      targetHiddenProgress.value = clamp(
        contentOffsetY / (latestTargetLayout.y + latestTargetLayout.height),
        0,
        1
      )
    }
  }

  // Animated styles for header transformation
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const targetHiddenProgressValue = targetHiddenProgress.value

    return {
      opacity: targetHiddenProgressValue,
      transform: [
        {
          translateY:
            (navigationHeaderLayout?.height ?? 0) *
            (1 - targetHiddenProgressValue)
        }
      ]
    }
  })

  useEffect(() => {
    navigation.setOptions({
      headerBackground: () => (
        <BlurredBackgroundView
          hasGrabber={shouldHeaderHaveGrabber}
          separator={
            hasSeparator
              ? {
                  position: 'bottom',
                  opacity: targetHiddenProgress
                }
              : undefined
          }
        />
      ),
      title: header && (
        <View
          sx={{
            paddingTop: shouldHeaderHaveGrabber ? 23 : 0,
            transform: [{ translateY: BOTTOM_INSET }],
            marginBottom: BOTTOM_INSET
          }}>
          <View
            sx={{
              overflow: 'hidden',
              justifyContent: 'center',
              height: '100%'
            }}
            onLayout={handleLayout}>
            <Animated.View style={animatedHeaderStyle}>{header}</Animated.View>
          </View>
        </View>
      )
    })
  }, [
    navigation,
    header,
    targetHiddenProgress,
    animatedHeaderStyle,
    shouldHeaderHaveGrabber,
    hasSeparator
  ])

  return {
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    targetHiddenProgress
  }
}

const BOTTOM_INSET = Platform.OS === 'ios' ? -4 : 0
