import { View } from '@avalabs/k2-alpine'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle
} from 'react-native'
import Animated, {
  SharedValue,
  clamp,
  useAnimatedStyle,
  useSharedValue
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
  hasSeparator = true,
  shouldDelayBlurOniOS = false,
  hasParent = false,
  headerStyle
}: {
  header?: JSX.Element
  targetLayout?: LayoutRectangle
  shouldHeaderHaveGrabber?: boolean
  hasSeparator?: boolean
  shouldDelayBlurOniOS?: boolean
  hasParent?: boolean
  headerStyle?: StyleProp<ViewStyle>
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

  const navigationOptions = useMemo(() => {
    return {
      headerStyle,
      headerBackground: () => (
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
      ),
      title: header && (
        <View
          sx={{
            paddingTop: shouldHeaderHaveGrabber ? 24 : 0,
            transform: [{ translateY: HEADER_BOTTOM_INSET }],
            marginBottom: shouldHeaderHaveGrabber ? HEADER_BOTTOM_INSET : 0,
            height: '100%'
          }}>
          <View
            sx={{
              overflow: 'hidden',
              height: '100%',
              justifyContent: 'center'
            }}
            onLayout={handleLayout}>
            <Animated.View style={animatedHeaderStyle}>{header}</Animated.View>
          </View>
        </View>
      )
    }
  }, [
    animatedHeaderStyle,
    hasSeparator,
    header,
    headerStyle,
    shouldDelayBlurOniOS,
    shouldHeaderHaveGrabber,
    targetHiddenProgress
  ])

  useEffect(() => {
    if (hasParent) {
      navigation.getParent()?.setOptions(navigationOptions)
    } else {
      navigation.setOptions(navigationOptions)
    }
  }, [hasParent, navigation, navigationOptions])

  return {
    onScroll: handleScroll,
    scrollEventThrottle: 16,
    targetHiddenProgress,
    scrollY
  }
}

const HEADER_BOTTOM_INSET = -6
