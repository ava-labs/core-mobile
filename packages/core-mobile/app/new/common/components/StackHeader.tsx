import { NavigationTitleHeader, View } from '@avalabs/k2-alpine'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import { Stack, useFocusEffect, useNavigation } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable
} from 'react-native'
import Animated, {
  clamp,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'

export function useStackHeader({
  title,
  headerRight,
  targetLayout,
  hideHeaderBackground,
  backgroundColor,
  shouldDelayBlurOniOS,
  hasBackgroundAnimation,
  hasParent = false,
  showNavigationHeaderTitle = true,
  hasSeparator = true
}: {
  title?: string
  hideHeaderBackground?: boolean
  backgroundColor?: string
  hasBackgroundAnimation?: boolean
  hasSeparator?: boolean
  shouldDelayBlurOniOS?: boolean
  hasParent?: boolean
  showNavigationHeaderTitle?: boolean
  targetLayout?: LayoutRectangle
  headerRight?: () => React.ReactNode
}): {
  scrollY: SharedValue<number>
  targetHiddenProgress: SharedValue<number>
  renderStackHeader: () => JSX.Element | null
  handleScroll: (
    event: NativeSyntheticEvent<NativeScrollEvent> | NativeScrollEvent | number
  ) => void
} {
  const navigation = useNavigation()
  const [navigationHeaderLayout, setNavigationHeaderLayout] = useState<
    LayoutRectangle | undefined
  >(undefined)

  const scrollY = useSharedValue(0)
  const targetHiddenProgress = useSharedValue(0) // from 0 to 1, 0 = fully hidden, 1 = fully shown

  // Ensures `handleScroll`, even when called inside `runJS`, always accesses
  // the latest `targetLayout`. Using a ref prevents stale values from being
  // captured in `useCallback` and keeps the layout data up to date.
  const targetLayoutRef = useRef(targetLayout)
  useEffect(() => {
    targetLayoutRef.current = targetLayout
  }, [targetLayout])

  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    const { x, y, width, height } = event.nativeEvent.layout
    setNavigationHeaderLayout(prev =>
      prev &&
      prev.x === x &&
      prev.y === y &&
      prev.width === width &&
      prev.height === height
        ? prev
        : { x, y, width, height }
    )
  }, [])

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

  // Memoize the header title component to prevent unnecessary re-creation
  // This helps prevent the "child already has a parent" error on Android
  const headerTitle = useCallback(() => {
    if (!showNavigationHeaderTitle) {
      return null
    }

    return (
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          // Hardcoded value for Android because 100% doesn't work properly
          // On iOS 26+, use fixed height to prevent Liquid Glass header resizing issues
          height: Platform.OS === 'ios' ? '100%' : 56
        }}>
        <View onLayout={handleLayout}>
          <Animated.View style={[animatedHeaderStyle]}>
            <NavigationTitleHeader title={title ?? ''} />
          </Animated.View>
        </View>
      </View>
    )
  }, [handleLayout, animatedHeaderStyle, showNavigationHeaderTitle, title])

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
      const h = latestTargetLayout.height
      targetHiddenProgress.value = h > 0 ? clamp(contentOffsetY / h, 0, 1) : 0
      scrollY.value = contentOffsetY
    }
  }

  const headerBackground = useCallback(() => {
    return hideHeaderBackground ? (
      // Use a Pressable to receive gesture events for modal gestures
      <Pressable style={{ flex: 1 }} />
    ) : (
      <BlurredBackgroundView
        backgroundColor={backgroundColor}
        shouldDelayBlurOniOS={shouldDelayBlurOniOS}
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
    backgroundColor,
    shouldDelayBlurOniOS,
    hasBackgroundAnimation,
    hasSeparator,
    targetHiddenProgress
  ])

  const headerRightComponent = useCallback((): React.ReactNode => {
    const content = headerRight?.()
    if (!content) return null
    // Wrap in a constrained container to prevent header right from enlarging
    // after repeated route open/close on iOS (React Navigation header slot can stretch)
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexGrow: 0,
          flexShrink: 0
        }}>
        {content}
      </View>
    )
  }, [headerRight])

  /**
   * `hasParent` screens live inside a nested navigator whose own header is
   * hidden (`headerShown: false`) — the visible header belongs to the parent
   * navigator. `Stack.Screen` can only configure the enclosing navigator, so
   * for these screens we set the parent's options imperatively while focused.
   * When `hasParent`, we "own" the parent's `headerRight`: set it when
   * provided, clear it when not.
   */
  useFocusEffect(
    useCallback(() => {
      if (!hasParent) return

      navigation.getParent()?.setOptions({
        headerTitle: showNavigationHeaderTitle ? headerTitle : undefined,
        headerBackground,
        headerRight: headerRight ? headerRightComponent : undefined
      })
    }, [
      hasParent,
      navigation,
      headerTitle,
      headerBackground,
      headerRight,
      headerRightComponent,
      showNavigationHeaderTitle
    ])
  )

  const renderStackHeader = useCallback((): JSX.Element | null => {
    if (hasParent) return null

    return (
      <Stack.Screen
        options={{
          headerTitle,
          headerBackground,
          // Only set `headerRight` when provided so we don't clobber static
          // options declared in the route's layout (e.g. home screen options).
          ...(headerRight ? { headerRight: headerRightComponent } : {})
        }}
      />
    )
  }, [
    hasParent,
    headerTitle,
    headerBackground,
    headerRight,
    headerRightComponent
  ])

  return {
    scrollY,
    targetHiddenProgress,
    handleScroll,
    renderStackHeader
  }
}
