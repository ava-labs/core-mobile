import { useCallback, useState } from 'react'
import { LayoutChangeEvent, ViewStyle } from 'react-native'
import {
  AnimatedStyle,
  SharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming
} from 'react-native-reanimated'

export const useSelectionTitleLayoutAndStyle = ({
  selectionX,
  graphWidth,
  horizontalInset,
  marginHorizontal = 12
}: {
  selectionX: SharedValue<number | undefined>
  graphWidth: number
  horizontalInset: number
  marginHorizontal?: number
}): {
  onLayout: (event: LayoutChangeEvent) => void
  animatedStyle: AnimatedStyle<ViewStyle>
} => {
  const [layout, setLayout] = useState<
    { width: number; height: number } | undefined
  >(undefined)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setLayout(event.nativeEvent.layout)
  }, [])

  const animatedStyle = useAnimatedStyle(() => {
    if (selectionX.value === undefined || layout === undefined)
      return { opacity: withTiming(0, { duration: 300 }) }

    const componentWidth = layout?.width ?? 0
    const translateX = Math.min(
      Math.max(
        selectionX.value + horizontalInset - componentWidth / 2,
        marginHorizontal
      ),
      graphWidth - componentWidth + horizontalInset + marginHorizontal
    )
    return {
      transform: [{ translateX }],
      opacity: withDelay(300, withTiming(1, { duration: 300 }))
    }
  }, [layout, graphWidth, selectionX])

  return { onLayout, animatedStyle }
}
