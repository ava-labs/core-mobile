import React, { useMemo, useState } from 'react'
import { LayoutChangeEvent, Pressable, ViewStyle } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useDerivedValue,
  SharedValue,
  DerivedValue
} from 'react-native-reanimated'
import { SxProp } from 'dripsy'
import { View } from '../Primitives'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'
import { useTheme } from '../../hooks'

export const SegmentedControl = ({
  items,
  selectedSegmentIndex, // now SharedValue<number>
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
}): JSX.Element => {
  const { theme } = useTheme()
  const [viewWidth, setViewWidth] = useState<number>(0)
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

  const translationAnimation = useDerivedValue(() => {
    if (viewWidth === 0) return 0

    const value = selectedSegmentIndex.get()

    return withSpring(
      viewWidth *
        textRatios.slice(0, Math.floor(value)).reduce((a, b) => a + b, 0) +
        viewWidth *
          (textRatios[Math.floor(value)] ?? 0) *
          (value - Math.floor(value)),
      Configuration.animation.indicatorWidthSpringConfig
    )
  }, [textRatios, viewWidth])

  const selectionIndicatorWidthAnimation = useDerivedValue(() => {
    if (viewWidth === 0) return 0

    const selectedSegmentIndexValue = selectedSegmentIndex.get()
    const indexFloor = Math.floor(selectedSegmentIndexValue)
    const indexCeil = Math.ceil(selectedSegmentIndexValue)
    const fraction = selectedSegmentIndexValue - indexFloor
    // If fraction is 0 (i.e. value is an integer), weight becomes 1.
    const weight = fraction || 1

    const widthFloor = textRatios[indexFloor] ?? 0
    const widthCeil = textRatios[indexCeil] ?? 0

    return viewWidth * (widthFloor * (1 - weight) + widthCeil * weight)
  }, [viewWidth, textRatios])

  const selectionIndicatorOpacityAnimation = useDerivedValue(() => {
    if (viewWidth !== 0 && textRatios[0] !== 0) {
      return withTiming(1, {
        duration: Configuration.animation.indicatorTranslation.duration
      })
    }
    return 0
  }, [viewWidth, textRatios])

  const selectionIndicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: selectionIndicatorWidthAnimation.get(),
      transform: [
        {
          translateX: translationAnimation.get()
        }
      ],
      opacity: selectionIndicatorOpacityAnimation.get()
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

  return (
    <View style={style}>
      <View
        sx={{
          borderRadius: 100,
          backgroundColor: theme.isDark ? '#C5C5C840' : '#99999940'
        }}>
        <View
          style={{ borderRadius: 100, flexDirection: 'row' }}
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
                sx={{ paddingVertical: type === 'thin' ? 8 : 12 }}
                key={index}
                ratio={textRatios[index]}
                text={item}
                index={index}
                selectedIndex={selectedSegmentIndex}
                onTextWidthChange={width => handleTextWidthChange(index, width)}
                onPress={() => onSelectSegment(index)}
              />
            )
          })}
        </View>
      </View>
    </View>
  )
}

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
  ratio?: number
  text: string
  index: number
  selectedIndex: SharedValue<number>
  backgroundColor?: string
  onTextWidthChange: (width: number) => void
  onPress: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  const handleTextLayout = (event: LayoutChangeEvent): void => {
    onTextWidthChange(event.nativeEvent.layout.width + 64)
  }

  const textColorAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      Math.max(1 - Math.abs(selectedIndex.get() - index), 0),
      [0, 1],
      [
        theme.colors.$textPrimary,
        theme.isDark
          ? lightModeColors.$textPrimary
          : darkModeColors.$textPrimary
      ]
    )
    return { color }
  })

  return (
    <Pressable style={{ flex: ratio }} onPress={onPress}>
      <View sx={{ alignItems: 'center', backgroundColor, ...sx }}>
        <Animated.Text
          onLayout={handleTextLayout}
          style={[
            { fontFamily: 'Inter-SemiBold', fontSize: 14, lineHeight: 18 },
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

const getFractionalPart = (num: number): number => {
  'worklet'
  const fraction = num - Math.floor(num)
  return fraction === 0 ? 1 : fraction
}
