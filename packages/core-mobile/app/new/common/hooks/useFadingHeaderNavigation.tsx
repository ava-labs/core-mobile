import { View } from '@avalabs/k2-alpine'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform
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
  backgroundColor,
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
  backgroundColor?: string
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

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    setNavigationHeaderLayout(event.nativeEvent.layout)
  }, [])

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
        contentOffsetY / latestTargetLayout.height,
        0,
        1
      )
      scrollY.value = contentOffsetY
    }
  }

  const headerHeight =
    targetLayout?.height ?? navigationHeaderLayout?.height ?? 0

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      targetHiddenProgress.value,
      [0, 0.7],
      [headerHeight, 0],
      'clamp'
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

  const headerBackgroundComponent = useMemo(() => {
    return hideHeaderBackground ? (
      // Use a Pressable to receive gesture events for modal gestures
      <Pressable style={{ flex: 1 }}>
        {shouldHeaderHaveGrabber === true ? <Grabber /> : null}
      </Pressable>
    ) : (
      <BlurredBackgroundView
        backgroundColor={backgroundColor}
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
  }, [
    hideHeaderBackground,
    shouldHeaderHaveGrabber,
    backgroundColor,
    shouldDelayBlurOniOS,
    hasSeparator,
    targetHiddenProgress
  ])

  const headerBackground = useCallback(() => {
    return headerBackgroundComponent
  }, [headerBackgroundComponent])

  // Memoize the header title component to prevent unnecessary re-creation
  // This helps prevent the "child already has a parent" error on Android
  const headerTitleComponent = useMemo(() => {
    return (
      <View
        style={[
          {
            justifyContent: 'center',
            overflow: 'hidden'
          },
          Platform.OS === 'ios'
            ? {
                paddingTop: shouldHeaderHaveGrabber ? 4 : 0,
                height: '100%'
              }
            : {
                // Hardcoded value for Android because 100% doesn't work properly
                height: 56
              }
        ]}>
        <View onLayout={handleLayout}>
          <Animated.View style={[animatedHeaderStyle]}>{header}</Animated.View>
        </View>
      </View>
    )
  }, [shouldHeaderHaveGrabber, animatedHeaderStyle, header, handleLayout])

  // Return a stable function reference that returns the memoized component
  const headerTitle = useCallback(() => {
    return headerTitleComponent
  }, [headerTitleComponent])

  useFocusEffect(
    useCallback(() => {
      const navigationOptions: NativeStackNavigationOptions = {
        headerBackground
      }

      if (showNavigationHeaderTitle && header) {
        navigationOptions.headerTitle = headerTitle
      }

      // If a custom right header component is provided, set it in the navigation options
      if (renderHeaderRight) {
        navigationOptions.headerRight = renderHeaderRight
      }

      const targetNavigation = hasParent ? navigation.getParent() : navigation

      // Set the navigation options
      targetNavigation?.setOptions(navigationOptions)

      // Clean up all header options when the screen is unmounted or loses focus
      // This prevents the "child already has a parent" error by ensuring
      // old header views are properly removed before new ones are added
      return () => {
        const cleanupOptions: NativeStackNavigationOptions = {
          headerBackground: undefined,
          headerTitle: undefined,
          headerRight: undefined
        }
        targetNavigation?.setOptions(cleanupOptions)
      }
    }, [
      headerBackground,
      headerTitle,
      showNavigationHeaderTitle,
      header,
      renderHeaderRight,
      hasParent,
      navigation
    ])
  )

  return {
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    targetHiddenProgress,
    scrollY
  }
}
