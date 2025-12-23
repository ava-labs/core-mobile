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
import Grabber from 'common/components/Grabber'
import { Pressable } from 'react-native-gesture-handler'

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
  showNavigationHeaderTitle = true,
  hasBackgroundAnimation = false
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
  hasBackgroundAnimation?: boolean
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

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const headerHeight =
      targetLayout?.height ?? navigationHeaderLayout?.height ?? 0
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
        hasAnimation={hasBackgroundAnimation}
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
    hasBackgroundAnimation,
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
        style={{
          justifyContent: 'center',
          overflow: 'hidden',
          // Hardcoded value for Android because 100% doesn't work properly
          height: Platform.OS === 'ios' ? '100%' : 56
        }}>
        <View onLayout={handleLayout}>
          <Animated.View style={[animatedHeaderStyle]}>{header}</Animated.View>
        </View>
      </View>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldHeaderHaveGrabber, header, handleLayout])

  // Return a stable function reference that returns the memoized component
  const headerTitle = useCallback(() => {
    return headerTitleComponent
  }, [headerTitleComponent])

  // Use refs to store the latest values - updated via useEffect
  const headerBackgroundRef = useRef(headerBackground)
  const headerTitleRef = useRef(headerTitle)
  const renderHeaderRightRef = useRef(renderHeaderRight)

  useEffect(() => {
    headerBackgroundRef.current = headerBackground
  }, [headerBackground])

  useEffect(() => {
    headerTitleRef.current = headerTitle
  }, [headerTitle])

  useEffect(() => {
    renderHeaderRightRef.current = renderHeaderRight
  }, [renderHeaderRight])

  // Create stable wrapper functions ONCE (outside useFocusEffect)
  const stableHeaderBackground = useCallback((): React.ReactNode => {
    return headerBackgroundRef.current()
  }, [])

  const stableHeaderTitle = useCallback((): React.ReactNode => {
    return headerTitleRef.current()
  }, [])

  const stableHeaderRight = useCallback((): React.ReactNode => {
    return renderHeaderRightRef.current?.()
  }, [])

  /**
   * Keep `headerRight` in sync while the screen is focused.
   *
   * React Navigation won't re-render the header just because the implementation
   * of `renderHeaderRight` changed; it needs `setOptions`. We keep a stable
   * function reference (to avoid Android "child already has a parent" issues)
   * and update options whenever the caller passes a new `renderHeaderRight`.
   *
   * Important: if `renderHeaderRight` is NOT provided, we do not touch
   * `headerRight` at all (so static screen options like `homeScreenOptions`
   * remain intact).
   *
   * Also: no blur cleanup here, since clearing on blur can race and clobber
   * the next focused screen's header options (especially when using `getParent()`).
   */
  useFocusEffect(
    useCallback(() => {
      const nav = hasParent ? navigation.getParent() : navigation
      /**
       * `headerRight` handling rules:
       * - If this screen targets a parent navigator (`hasParent`), we "own" the
       *   parent's `headerRight` while focused, so we either set it (when provided)
       *   or clear it (when not provided).
       * - If this screen does NOT target a parent, we only set `headerRight`
       *   when explicitly provided, to avoid clobbering static options
       *   (e.g. Portfolio `homeScreenOptions`).
       */
      if (hasParent) {
        nav?.setOptions({
          headerRight: renderHeaderRight ? stableHeaderRight : undefined
        })
        return
      }

      if (renderHeaderRight) {
        nav?.setOptions({ headerRight: stableHeaderRight })
      }
    }, [hasParent, navigation, renderHeaderRight, stableHeaderRight])
  )

  // Set navigation options on focus
  useFocusEffect(
    useCallback(() => {
      const nav = hasParent ? navigation.getParent() : navigation

      const navigationOptions: NativeStackNavigationOptions = {
        headerBackground: stableHeaderBackground
      }

      if (showNavigationHeaderTitle) {
        navigationOptions.headerTitle = stableHeaderTitle
      }

      // Set the navigation options
      nav?.setOptions(navigationOptions)

      // Clean up navigation options when the screen is unmounted
      return () => {
        nav?.setOptions({
          headerBackground: undefined,
          headerTitle: undefined
        })
      }
      // Only depend on stable references - runs once on mount/focus
    }, [
      hasParent,
      navigation,
      stableHeaderBackground,
      stableHeaderTitle,
      showNavigationHeaderTitle
    ])
  )

  return {
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    targetHiddenProgress,
    scrollY
  }
}
