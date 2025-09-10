import { SxProp } from 'dripsy'
import { BlurView } from 'expo-blur'
import throttle from 'lodash/throttle'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  InteractionManager,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  ViewStyle
} from 'react-native'
import Animated, {
  DerivedValue,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'
import { View } from '../Primitives'

export const SegmentedControl = ({
  items,
  selectedSegmentIndex,
  onSelectSegment,
  dynamicItemWidth,
  style,
  type = 'default'
}: {
  items: string[]
  selectedSegmentIndex: SharedValue<number> | DerivedValue<number>
  onSelectSegment: (index: number) => void
  dynamicItemWidth: boolean
  style?: ViewStyle
  type?: 'default' | 'thin'
}): JSX.Element | null => {
  const [isReady, setIsReady] = useState(true)
  const { theme } = useTheme()

  const viewWidth = useSharedValue(0)
  const textWidths = useSharedValue(Array(items.length).fill(0))

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true)
    })
    return () => task.cancel()
  }, [])

  const textRatios = useDerivedValue(() => {
    if (!dynamicItemWidth) return Array(items.length).fill(1 / items.length)
    const sum = textWidths.value.reduce((a: number, b: number) => a + b, 0)
    return sum === 0
      ? Array(items.length).fill(0)
      : textWidths.value.map((w: number) => w / sum)
  }, [dynamicItemWidth, items.length])

  const translationAnimation = useDerivedValue(() => {
    if (viewWidth.value === 0) return 0
    const value = selectedSegmentIndex.value
    const ratios = textRatios.value
    const floor = Math.floor(value)
    return withSpring(
      viewWidth.value *
        ratios.slice(0, floor).reduce((a: number, b: number) => a + b, 0) +
        viewWidth.value * (ratios[floor] || 0) * (value - floor),
      Configuration.animation.indicatorWidthSpringConfig
    )
  })

  const selectionIndicatorWidthAnimation = useDerivedValue(() => {
    if (viewWidth.value === 0) return 0
    const value = selectedSegmentIndex.value
    const floor = Math.floor(value)
    const ceil = Math.ceil(value)
    const fraction = value - floor
    // If fraction is 0 (i.e. value is an integer), weight becomes 1.
    const weight = fraction || 1
    const ratios = textRatios.value
    return (
      viewWidth.value *
      ((ratios[floor] || 0) * (1 - weight) + (ratios[ceil] || 0) * weight)
    )
  })

  const selectionIndicatorOpacityAnimation = useDerivedValue(() => {
    return viewWidth.value !== 0 && textRatios.value[0] !== 0
      ? withTiming(1, Configuration.animation.indicatorTranslation)
      : 0
  })

  const selectionIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    width: selectionIndicatorWidthAnimation.value,
    transform: [{ translateX: translationAnimation.value }],
    opacity: selectionIndicatorOpacityAnimation.value
  }))

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewWidth.value = event.nativeEvent.layout.width
    },
    [viewWidth]
  )

  const handleTextWidthChange = useCallback(
    (index: number, width: number) => {
      textWidths.value = textWidths.value.map((w, i) =>
        i === index ? width : w
      )
    },
    [textWidths]
  )

  if (!isReady) {
    return null
  }

  return (
    <View style={style}>
      <BlurView
        intensity={30}
        style={{
          borderRadius: 100,
          overflow: 'hidden',
          backgroundColor: theme.isDark ? '#C5C5C840' : '#28282820'
        }}>
        <View style={styles.container} onLayout={handleLayout}>
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: theme.colors.$textPrimary },
              selectionIndicatorAnimatedStyle
            ]}
          />
          {items.map((item, index) => {
            return (
              <Segment
                sx={{ paddingVertical: type === 'thin' ? 8 : 12 }}
                key={index}
                ratio={dynamicItemWidth ? textRatios : 1 / items.length}
                text={item}
                index={index}
                selectedIndex={selectedSegmentIndex}
                onTextWidthChange={
                  dynamicItemWidth ? handleTextWidthChange : undefined
                }
                onPress={() => onSelectSegment(index)}
              />
            )
          })}
        </View>
      </BlurView>
    </View>
  )
}

const THROTTLE_DURATION = 100

const Segment = ({
  sx,
  ratio,
  text,
  index,
  selectedIndex,
  backgroundColor,
  onTextWidthChange,
  onPress
}: {
  sx?: SxProp
  ratio: number | DerivedValue<number[]>
  text: string
  index: number
  selectedIndex: SharedValue<number>
  backgroundColor?: string
  onTextWidthChange?: (index: number, width: number) => void
  onPress: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  const throttledOnPress = useMemo(
    () =>
      throttle(onPress, THROTTLE_DURATION, {
        leading: true,
        trailing: false
      }),
    [onPress]
  )

  useEffect(() => {
    return () => {
      throttledOnPress.cancel()
    }
  }, [throttledOnPress])

  const flexStyle = useAnimatedStyle(() => ({
    flex: typeof ratio === 'number' ? ratio : ratio.value[index] || 1
  }))

  const textColorAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      Math.max(1 - Math.abs(selectedIndex.value - index), 0),
      [0, 1],
      [
        theme.colors.$textPrimary,
        theme.isDark
          ? lightModeColors.$textPrimary
          : darkModeColors.$textPrimary
      ]
    )
  }))

  const handleTextLayout = onTextWidthChange
    ? (event: LayoutChangeEvent) => {
        onTextWidthChange(index, event.nativeEvent.layout.width + 64)
      }
    : undefined

  return (
    <Animated.View style={flexStyle}>
      <Pressable onPress={throttledOnPress}>
        <View sx={{ alignItems: 'center', backgroundColor, ...sx }}>
          <Animated.Text
            onLayout={handleTextLayout}
            style={[styles.text, textColorAnimatedStyle]}
            allowFontScaling={false}>
            {text}
          </Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { borderRadius: 100, flexDirection: 'row' },
  indicator: { position: 'absolute', top: 0, bottom: 0, borderRadius: 100 },
  text: { fontFamily: 'Inter-SemiBold', fontSize: 14, lineHeight: 18 }
})

const Configuration = {
  animation: {
    indicatorTranslation: {
      duration: 250
    },
    indicatorWidthSpringConfig: {
      damping: 28,
      stiffness: 350,
      mass: 1,
      overshootClamping: false
    },
    selectedTextColor: {
      delay: 0,
      duration: 250
    }
  }
}
