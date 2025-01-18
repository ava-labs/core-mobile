import React, { useEffect, useMemo, useState } from 'react'
import { LayoutChangeEvent, Pressable, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { alpha, useTheme } from '../..'
import { View } from '../Primitives'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'

export const SegmentedControl = ({
  items,
  selectedSegmentIndex,
  onSelectSegment,
  dynamicItemWidth,
  style
}: {
  items: string[]
  selectedSegmentIndex: number
  onSelectSegment: (index: number) => void
  dynamicItemWidth: boolean
  style?: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const [viewWidth, setViewWidth] = useState<number>(0)
  const translationAnimation = useSharedValue(0)
  const selectionIndicatorWidthAnimation = useSharedValue(0)
  const selectionIndicatorOpacityAnimation = useSharedValue(0)
  const [textWidths, setTextWidths] = useState<number[]>(
    Array.from({ length: items.length }, () => 0)
  )
  const textRatios = useMemo(() => {
    if (!dynamicItemWidth) {
      return Array.from({ length: items.length }, () => 1 / items.length)
    }

    const textWidthSum = textWidths.reduce((a, b) => a + b, 0)
    if (textWidthSum === 0) {
      return Array.from({ length: items.length }, () => 0)
    }
    return textWidths.map(textWidth => textWidth / textWidthSum)
  }, [textWidths, items.length, dynamicItemWidth])

  const selectionIndicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: selectionIndicatorWidthAnimation.value,
      transform: [
        {
          translateX: translationAnimation.value
        }
      ],
      opacity: selectionIndicatorOpacityAnimation.value
    }
  })

  const handleTextWidthChange = (index: number, width: number): void => {
    setTextWidths(prev => {
      const newWidths = [...prev]
      newWidths[index] = width
      return newWidths
    })
  }

  const handleLayout = (event: LayoutChangeEvent): void => {
    setViewWidth(event.nativeEvent.layout.width)
  }

  useEffect(() => {
    const x =
      viewWidth *
      textRatios.slice(0, selectedSegmentIndex).reduce((a, b) => a + b, 0)
    translationAnimation.value = withSpring(
      x,
      Configuration.animation.indicatorWidthSpringConfig
    )

    selectionIndicatorWidthAnimation.value = withTiming(
      viewWidth * (textRatios[selectedSegmentIndex] ?? 0),
      {
        duration: Configuration.animation.indicatorTranslation.duration,
        easing: Easing.inOut(Easing.cubic)
      },
      isFinished => {
        if (isFinished && textRatios[0] !== 0) {
          selectionIndicatorOpacityAnimation.value = withTiming(1, {
            duration: Configuration.animation.indicatorTranslation.duration
          })
        }
      }
    )
  }, [
    selectionIndicatorOpacityAnimation,
    translationAnimation,
    selectedSegmentIndex,
    textRatios,
    viewWidth,
    selectionIndicatorWidthAnimation
  ])

  return (
    <View
      style={[
        {
          borderRadius: 100,
          backgroundColor: alpha(theme.colors.$textPrimary, 0.2),
          flexDirection: 'row'
        },
        style
      ]}
      onLayout={handleLayout}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            backgroundColor: theme.colors.$textPrimary,
            borderRadius: 100
          },
          selectionIndicatorAnimatedStyle
        ]}
      />
      {items.map((item, index) => {
        return (
          <Segment
            key={index}
            ratio={textRatios[index]}
            text={item}
            selected={index === selectedSegmentIndex}
            onTextWidthChange={width => handleTextWidthChange(index, width)}
            onPress={() => onSelectSegment(index)}
          />
        )
      })}
    </View>
  )
}

const Segment = ({
  ratio,
  text,
  selected,
  backgroundColor,
  onTextWidthChange,
  onPress
}: {
  ratio?: number
  text: string
  selected: boolean
  backgroundColor?: string
  onTextWidthChange: (width: number) => void
  onPress: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  const handleTextLayout = (event: LayoutChangeEvent): void => {
    onTextWidthChange(event.nativeEvent.layout.width + 64)
  }

  const textColorAnimation = useSharedValue(0)

  useEffect(() => {
    textColorAnimation.value = withDelay(
      Configuration.animation.selectedTextColor.delay,
      withTiming(selected ? 1 : 0, {
        duration: Configuration.animation.selectedTextColor.duration
      })
    )
  }, [textColorAnimation, selected])

  const textColorAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      textColorAnimation.value,
      [0, 1],
      [
        theme.colors.$textPrimary,
        theme.isDark
          ? lightModeColors.$textPrimary
          : darkModeColors.$textPrimary
      ]
    )

    return {
      color
    }
  })

  return (
    <Pressable style={{ flex: ratio }} onPress={onPress}>
      <View
        sx={{
          paddingVertical: 12,
          alignItems: 'center',
          backgroundColor
        }}>
        <Animated.Text
          onLayout={handleTextLayout}
          style={[
            {
              fontFamily: 'Inter-SemiBold',
              fontSize: 15,
              lineHeight: 18
            },
            textColorAnimatedStyle
          ]}>
          {text}
        </Animated.Text>
      </View>
    </Pressable>
  )
}

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
