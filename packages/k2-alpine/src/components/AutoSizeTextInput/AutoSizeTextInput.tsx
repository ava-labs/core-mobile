import { SxProp } from 'dripsy'
import React, { forwardRef, useState } from 'react'
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

export const AutoFitTextInput = forwardRef<TextInput, TextInputProps>(
  ({ initialFontSize = 42, ...props }, ref): JSX.Element => {
    const animatedFontSize = useSharedValue(initialFontSize)
    const [containerWidth, setContainerWidth] = useState(0)

    const handleLayout = (e: LayoutChangeEvent): void => {
      setContainerWidth(e.nativeEvent.layout.width)
    }

    const handleTextChange = (value: string): void => {
      props.onChangeText?.(value)
    }

    const textStyle = useAnimatedStyle(() => {
      return {
        fontSize: animatedFontSize.value
      }
    })

    const textInputStyle = useAnimatedStyle(() => {
      return {
        fontSize: animatedFontSize.value
      }
    })

    const handleTextLayout = (e: LayoutChangeEvent): void => {
      if (!containerWidth) return

      const textWidth = e.nativeEvent.layout.width

      if (textWidth > 0) {
        const ratio = containerWidth / textWidth
        const newFontSize = Math.max(
          10,
          Math.min(initialFontSize, Math.floor(animatedFontSize.value * ratio))
        )

        if (newFontSize !== animatedFontSize.value) {
          animatedFontSize.value = withTiming(newFontSize, {
            ...ANIMATED.TIMING_CONFIG,
            duration: 300
          })
        }
      }
    }

    return (
      <>
        <View
          onLayout={handleLayout}
          style={{
            width: '100%'
          }}>
          <AnimatedTextInput
            {...props}
            ref={ref}
            style={[{ padding: 0 }, textInputStyle, props.style]}
            allowFontScaling={false}
            multiline={false}
            numberOfLines={1}
            value={props.value}
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
                paddingRight: Platform.OS === 'ios' ? 32 : 0,
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
  }
)
