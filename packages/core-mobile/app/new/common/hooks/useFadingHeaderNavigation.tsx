import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React, { useEffect, useRef, useState } from 'react'
import { View } from '@avalabs/k2-alpine'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native'
import { useNavigation } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  SharedValue,
  clamp
} from 'react-native-reanimated'

export const useFadingHeaderNavigation = ({
  header,
  targetLayout
}: {
  header?: JSX.Element
  targetLayout?: LayoutRectangle
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
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: targetHiddenProgress.value,
    transform: [
      {
        translateY:
          (navigationHeaderLayout?.height ?? 0) *
          (1 - targetHiddenProgress.value)
      }
    ]
  }))

  useEffect(() => {
    navigation.setOptions({
      headerBackground: () => (
        <BlurredBackgroundView
          separator={{
            position: 'bottom',
            opacity: targetHiddenProgress
          }}
        />
      ),
      title: header && (
        <View
          sx={{
            overflow: 'hidden',
            height: '100%',
            justifyContent: 'center'
          }}
          onLayout={handleLayout}>
          <Animated.View style={animatedHeaderStyle}>{header}</Animated.View>
        </View>
      )
    })
  }, [navigation, header, targetHiddenProgress, animatedHeaderStyle])

  return {
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    targetHiddenProgress
  }
}
