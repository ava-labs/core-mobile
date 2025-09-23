import { SxProp } from 'dripsy'
import React, {
  forwardRef,
  useState,
  useCallback,
  useRef,
  useImperativeHandle
} from 'react'
import {
  LayoutChangeEvent,
  Platform,
  TextInput,
  TextStyle,
  TextInputProps as _TextInputProps
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { ANIMATED } from '../../utils'
import { View } from '../Primitives'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

interface TextInputProps extends _TextInputProps {
  rightIcon?: React.ReactNode
  leftIcon?: React.ReactNode
  containerSx?: SxProp
  textInputSx?: TextStyle
  initialFontSize?: number
}

export const AutoFitTextInput = forwardRef<
  {
    focus: () => void
    blur: () => void
    setNativeProps: (props: TextInputProps) => void
  },
  TextInputProps
>(({ initialFontSize = 36, onChangeText, ...props }, ref): JSX.Element => {
  const animatedFontSize = useSharedValue(initialFontSize)
  const [containerWidth, setContainerWidth] = useState(0)
  const inputRef = useRef<TextInput>(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    setNativeProps: (props: TextInputProps) =>
      inputRef.current?.setNativeProps(props)
  }))

  const handleLayout = useCallback((e: LayoutChangeEvent): void => {
    setContainerWidth(e.nativeEvent.layout.width)
  }, [])

  const handleTextChange = useCallback(
    (value: string): void => {
      onChangeText?.(value)
    },
    [onChangeText]
  )

  const textStyle = useAnimatedStyle(() => {
    return {
      fontSize: animatedFontSize.value,
      lineHeight: animatedFontSize.value
    }
  })

  const handleTextLayout = useCallback(
    (e: LayoutChangeEvent): void => {
      if (!containerWidth) return

      const textWidth = e.nativeEvent.layout.width

      if (textWidth > 0) {
        const ratio = containerWidth / textWidth
        const newFontSize = Math.max(
          10,
          Math.min(initialFontSize, Math.round(animatedFontSize.value * ratio))
        )

        // Only animate if there's a meaningful difference (avoid micro-adjustments)
        if (Math.abs(newFontSize - animatedFontSize.value) > 0.5) {
          animatedFontSize.value = withTiming(newFontSize, {
            ...ANIMATED.TIMING_CONFIG,
            duration: 300
          })
        }
      }
    },
    [containerWidth, initialFontSize, animatedFontSize]
  )

  return (
    <>
      <View
        onLayout={handleLayout}
        style={{
          width: '100%'
        }}>
        <AnimatedTextInput
          {...props}
          ref={inputRef}
          style={[{ padding: 0 }, textStyle, props.style]}
          multiline={false}
          numberOfLines={1}
          onChangeText={handleTextChange}
        />
      </View>

      {/* Hidden TextInput for capturing layout width */}
      <View
        style={{
          position: 'absolute',
          zIndex: 10
        }}>
        <Animated.Text
          pointerEvents="none"
          numberOfLines={1}
          style={[
            {
              flexShrink: 0, // prevent it from shrinking to fit
              flexWrap: 'nowrap',
              fontFamily: 'Aeonik-Medium',
              position: 'absolute',
              textAlign: 'right',
              right: 0,
              paddingRight: Platform.OS === 'ios' ? 32 : 6,
              opacity: 0
            },
            textStyle
          ]}
          onLayout={handleTextLayout}>
          {props.value || ' '}
        </Animated.Text>
      </View>
    </>
  )
})
