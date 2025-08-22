import { View } from '@avalabs/k2-alpine'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React, { useEffect, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native'
import Animated, {
  SharedValue,
  clamp,
  interpolate,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
/**
 * Temporarily import "useNavigation" from @react-navigation/native.
 * This is a workaround due to a render bug in the expo-router version.
 * See: https://github.com/expo/expo/issues/35383
 * TODO: Adjust import back to expo-router once the bug is resolved.
 */
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { Pressable } from 'react-native-gesture-handler'
import Grabber from 'common/components/Grabber'

export const useFadingHeaderNavigation = ({
  header,
  targetLayout,
  shouldHeaderHaveGrabber = false,
  hideHeaderBackground = false,
  hasSeparator = true,
  shouldDelayBlurOniOS = false,
  hasParent = false,
  renderHeaderRight,
  showNavigationHeaderTitle = true
}: {
  header?: React.ReactNode
  targetLayout?: LayoutRectangle
  shouldHeaderHaveGrabber?: boolean
  hideHeaderBackground?: boolean
  hasSeparator?: boolean
  shouldDelayBlurOniOS?: boolean
  hasParent?: boolean
  renderHeaderRight?: () => React.ReactNode
  showNavigationHeaderTitle?: boolean
}): {
  onScroll: (
    event: NativeSyntheticEvent<NativeScrollEvent> | NativeScrollEvent | number
  ) => void
  scrollEventThrottle: number
  scrollY: SharedValue<number>
  targetHiddenProgress: SharedValue<number>
} => {
  const navigation = useNavigation()
  const scrollY = useSharedValue(0)
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
      scrollY.value = contentOffsetY
    }
  }

  const headerHeight =
    targetLayout?.height ?? navigationHeaderLayout?.height ?? 0

  // Animated styles for header transformation
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      targetHiddenProgress.value,
      [0, 1],
      [headerHeight, 0]
    )

    return {
      opacity: targetHiddenProgress.value,
      transform: [
        {
          translateY: translateY
        }
      ]
    }
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  useFocusEffect(() => {
    const navigationOptions: NativeStackNavigationOptions = {
      headerBackground: () =>
        hideHeaderBackground ? (
          // Use a Pressable to receive gesture events for modal gestures
          <Pressable style={{ flex: 1 }}>
            {shouldHeaderHaveGrabber === true ? <Grabber /> : null}
          </Pressable>
        ) : (
          <BlurredBackgroundView
            shouldDelayBlurOniOS={shouldDelayBlurOniOS}
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
        )
    }

    if (showNavigationHeaderTitle && header) {
      navigationOptions.headerTitle = () => (
        <View
          sx={{
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
          <View onLayout={handleLayout}>
            <Animated.View style={[animatedHeaderStyle]}>
              {header}
            </Animated.View>
          </View>
        </View>
      )
    }

    // If a custom header right component is provided, set it
    if (renderHeaderRight) {
      navigationOptions.headerRight = renderHeaderRight

      if (hasParent) {
        navigation.getParent()?.setOptions(navigationOptions)

        // Clean up the header right component when the screen is unmounted
        return () => {
          navigation.getParent()?.setOptions({
            headerRight: undefined
          })
        }
      } else {
        navigation.setOptions(navigationOptions)

        // Clean up the header right component when the screen is unmounted
        return () => {
          navigation.setOptions({
            headerRight: undefined
          })
        }
      }
    }

    // Set the navigation options
    if (hasParent) {
      navigation.getParent()?.setOptions(navigationOptions)
    } else {
      navigation.setOptions(navigationOptions)
    }
  })

  return {
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    targetHiddenProgress,
    scrollY
  }
}
