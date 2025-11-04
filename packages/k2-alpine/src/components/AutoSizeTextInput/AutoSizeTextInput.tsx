import { SxProp } from 'dripsy'
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import {
  TextInputProps as _TextInputProps,
  LayoutChangeEvent,
  Platform,
  TextInput,
  TextStyle
} from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'

import { alpha, ANIMATED } from '../../utils'
import { View } from '../Primitives'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

interface TextInputProps extends _TextInputProps {
  prefix?: string
  suffix?: string
  suffixSx?: TextStyle
  prefixSx?: TextStyle
  containerSx?: SxProp
  textInputSx?: TextStyle
  initialFontSize?: number
  renderLeft?: () => React.ReactNode
  renderRight?: () => React.ReactNode
}

export const AutoFitTextInput = forwardRef<
  {
    focus: () => void
    blur: () => void
    setNativeProps: (props: TextInputProps) => void
  },
  TextInputProps
>(
  (
    {
      initialFontSize = 36,
      maxLength = 20,
      prefix,
      suffix,
      textAlign,
      prefixSx,
      suffixSx,
      renderLeft,
      renderRight,
      onChangeText,
      ...props
    },
    ref
  ): JSX.Element => {
    const { theme } = useTheme()
    const animatedFontSize = useSharedValue(initialFontSize)
    const [containerWidth, setContainerWidth] = useState(0)
    const inputRef = useRef<TextInput>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      setNativeProps: (_props: TextInputProps) =>
        inputRef.current?.setNativeProps(_props)
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
        fontFamily: 'Aeonik-Medium',
        fontSize: animatedFontSize.value,
        lineHeight: animatedFontSize.value + 4
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
            Math.min(
              initialFontSize,
              Math.round(animatedFontSize.value * ratio)
            )
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
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5
          }}>
          {renderLeft
            ? renderLeft?.()
            : prefix && (
                <Animated.Text style={[textStyle, props.style, prefixSx]}>
                  {prefix}
                </Animated.Text>
              )}
          <AnimatedTextInput
            {...props}
            ref={inputRef}
            style={[{ padding: 0 }, textStyle, props.style]}
            maxLength={maxLength}
            onChangeText={handleTextChange}
            placeholderTextColor={alpha(theme.colors.$textSecondary, 0.2)}
            selectionColor={theme.colors.$textPrimary}
            multiline={false}
            numberOfLines={1}
            allowFontScaling={false}
          />
          {renderRight
            ? renderRight?.()
            : suffix && (
                <Animated.Text style={[textStyle, props.style, suffixSx]}>
                  {suffix}
                </Animated.Text>
              )}
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
                textAlign,
                right: textAlign === 'right' ? 0 : undefined,
                left: textAlign === 'left' ? 0 : undefined,
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
  }
)
