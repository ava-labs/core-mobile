import React, { useState, useMemo, useCallback } from 'react'
import { LayoutChangeEvent, LayoutRectangle, ViewStyle } from 'react-native'
import { NavigationTitleHeader } from '@avalabs/k2-alpine'
import { useAnimatedStyle } from 'react-native-reanimated'
import { useFadingHeaderNavigation } from './useFadingHeaderNavigation'

interface FadingHeaderOptions {
  title: string
  shouldHeaderHaveGrabber?: boolean
}

// a wrapper around useFadingHeaderNavigation that provides a more convenient API
// for the simple use case of a fading header on a scrollable modal screen
export const useSimpleFadingHeader = ({
  title,
  shouldHeaderHaveGrabber = true
}: FadingHeaderOptions): {
  animatedHeaderStyle: ViewStyle
  onScroll: ReturnType<typeof useFadingHeaderNavigation>['onScroll']
  handleHeaderLayout: (event: LayoutChangeEvent) => void
} => {
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()

  const header = useMemo(() => <NavigationTitleHeader title={title} />, [title])

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }, [])

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  return {
    onScroll,
    animatedHeaderStyle,
    handleHeaderLayout
  }
}
