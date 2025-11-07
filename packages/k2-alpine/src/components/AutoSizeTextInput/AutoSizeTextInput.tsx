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
  NativeSyntheticEvent,
  Platform,
  Pressable,
  TextInput,
  TextInputFocusEventData,
  TextStyle
} from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import { View } from '../Primitives'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

interface TextInputProps extends _TextInputProps {
  /** Initial and maximum font size */
  initialFontSize?: number
  /** Container style */
  containerSx?: SxProp
  /** Left text that autoresizes */
  prefix?: string
  /** Right text that autoresizes */
  suffix?: string
  /** Left component with no autoresizing */
  renderLeft?: () => React.ReactNode
  /** Right component with no autoresizing */
  renderRight?: () => React.ReactNode
  /** Left text style */
  prefixSx?: TextStyle
  /** Right text style */
  suffixSx?: TextStyle
  /** Prefix fontSize multiplier */
  prefixFontSizeMultiplier?: number
  /** Suffix fontSize multiplier */
  suffixFontSizeMultiplier?: number
  /** Whether the input is valid */
  valid?: boolean
}

export const AutoSizeTextInput = forwardRef<
  {
    focus: () => void
    blur: () => void
    setNativeProps: (props: TextInputProps) => void
  },
  TextInputProps
>(
  (
    {
      initialFontSize = 42,
      maxLength = 20,
      prefix,
      suffix,
      textAlign,
      containerSx,
      prefixSx,
      suffixSx,
      suffixFontSizeMultiplier = 1,
      renderLeft,
      renderRight,
      onChangeText,
      editable = true,
      valid = true,
      ...props
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): JSX.Element => {
    const { theme } = useTheme()

    const [containerWidth, setContainerWidth] = useState(0)
    const [leftWidth, setLeftWidth] = useState(0)
    const [rightWidth, setRightWidth] = useState(0)

    const isFocused = useSharedValue(false)

    const animatedFontSize = useSharedValue(initialFontSize)
    const animatedSuffixFontSize = useSharedValue(
      initialFontSize * suffixFontSizeMultiplier
    )
    const inputRef = useRef<TextInput>(null)
    const lastTextRef = useRef<string>('')

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      setNativeProps: (_props: TextInputProps) =>
        inputRef.current?.setNativeProps(_props)
    }))

    const textColor = !valid
      ? theme.colors.$textDanger
      : editable
      ? theme.colors.$textPrimary
      : theme.colors.$textSecondary
    const placeholderTextColor = alpha(theme.colors.$textSecondary, 0.2)

    const textStyle = useAnimatedStyle(() => {
      const color = interpolateColor(
        props?.value && props?.value?.length > 0 ? 1 : 0,
        [0, 1],
        [placeholderTextColor, textColor]
      )
      return {
        textAlign,
        fontFamily: 'Aeonik-Medium',
        fontSize: animatedFontSize.value,
        lineHeight: animatedFontSize.value * 1.1,
        color
      }
    })

    const suffixTextStyle = useAnimatedStyle(() => {
      const color = interpolateColor(
        props?.value && props?.value?.length > 0 ? 1 : 0,
        [0, 1],
        [placeholderTextColor, textColor]
      )
      return {
        fontFamily: 'Aeonik-Medium',
        fontSize: animatedSuffixFontSize.value,
        lineHeight: animatedSuffixFontSize.value * 1.1,
        color
      }
    })

    const calculateAndUpdateFontSize = useCallback(
      (textWidth: number): void => {
        // Calculate gaps: gap appears between elements that exist
        const hasLeft = !!(renderLeft || prefix)
        const hasRight = !!(renderRight || suffix)
        const gapCount = (hasLeft ? 1 : 0) + (hasRight ? 1 : 0)
        const totalGapWidth = gapCount * GAP_WIDTH

        // Calculate available width for text input
        const availableWidth =
          containerWidth -
          leftWidth -
          rightWidth -
          totalGapWidth -
          (Platform.OS === 'ios' ? 32 : 8)

        if (availableWidth <= 0) return

        const ratio = availableWidth / textWidth
        let newFontSize = Math.round(animatedFontSize.value * ratio)
        let newSuffixFontSize = Math.round(animatedSuffixFontSize.value * ratio)
        newFontSize = Math.max(10, Math.min(initialFontSize, newFontSize))
        newSuffixFontSize = Math.max(
          10,
          Math.min(
            initialFontSize * suffixFontSizeMultiplier,
            newSuffixFontSize
          )
        )

        if (Math.abs(newFontSize - animatedFontSize.value) > 0.5) {
          animatedFontSize.value = newFontSize
        }
        if (Math.abs(newSuffixFontSize - animatedSuffixFontSize.value) > 0.5) {
          animatedSuffixFontSize.value = newSuffixFontSize
        }
      },
      [
        leftWidth,
        rightWidth,
        animatedFontSize,
        animatedSuffixFontSize,
        containerWidth,
        prefix,
        suffix,
        initialFontSize,
        renderLeft,
        renderRight,
        suffixFontSizeMultiplier
      ]
    )

    const handleLayout = useCallback((e: LayoutChangeEvent): void => {
      setContainerWidth(e.nativeEvent.layout.width)
    }, [])

    const handleLeftLayout = useCallback((e: LayoutChangeEvent): void => {
      setLeftWidth(e.nativeEvent.layout.width)
    }, [])

    const handleRightLayout = useCallback((e: LayoutChangeEvent): void => {
      setRightWidth(e.nativeEvent.layout.width)
    }, [])

    const handleTextLayout = useCallback(
      (e: LayoutChangeEvent): void => {
        if (!containerWidth) return

        const currentText = props.value || ''
        if (lastTextRef.current === currentText) {
          return
        }

        lastTextRef.current = currentText
        const textWidth = e.nativeEvent.layout.width

        if (textWidth > 0) {
          calculateAndUpdateFontSize(textWidth)
        }
      },
      [containerWidth, props.value, calculateAndUpdateFontSize]
    )

    const focusTextInput = useCallback(() => {
      inputRef.current?.focus()
    }, [])

    const renderPrefix = useCallback(() => {
      if (renderLeft) {
        return (
          <Pressable onPress={focusTextInput} onLayout={handleLeftLayout}>
            {renderLeft()}
          </Pressable>
        )
      }

      if (prefix) {
        return (
          <Pressable onPress={focusTextInput} onLayout={handleLeftLayout}>
            <Animated.Text style={[suffixTextStyle, prefixSx]}>
              {prefix}
            </Animated.Text>
          </Pressable>
        )
      }
    }, [
      renderLeft,
      prefix,
      focusTextInput,
      handleLeftLayout,
      suffixTextStyle,
      prefixSx
    ])

    const renderSuffix = useCallback(() => {
      if (renderRight) {
        return (
          <Pressable onPress={focusTextInput} onLayout={handleRightLayout}>
            {renderRight()}
          </Pressable>
        )
      }

      if (suffix) {
        return (
          <Pressable onPress={focusTextInput} onLayout={handleRightLayout}>
            <Animated.Text style={[suffixTextStyle, suffixSx]}>
              {suffix}
            </Animated.Text>
          </Pressable>
        )
      }
    }, [
      focusTextInput,
      handleRightLayout,
      renderRight,
      suffix,
      suffixSx,
      suffixTextStyle
    ])

    const onBlurTextInput = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        isFocused.value = false
        props.onBlur?.(e)
      },
      [isFocused, props]
    )

    const onFocusTextInput = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        isFocused.value = true
        props.onFocus?.(e)
      },
      [isFocused, props]
    )

    return (
      <View
        sx={{
          ...containerSx,
          minHeight: initialFontSize + 12,
          justifyContent: 'center'
        }}>
        <View
          onLayout={handleLayout}
          style={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: GAP_WIDTH
          }}>
          {renderPrefix()}

          <AnimatedTextInput
            {...props}
            ref={inputRef}
            style={[{ padding: 0 }, textStyle, props.style]}
            maxLength={maxLength}
            editable={editable}
            onBlur={onBlurTextInput}
            onFocus={onFocusTextInput}
            onChangeText={onChangeText}
            placeholderTextColor={placeholderTextColor}
            selectionColor={theme.colors.$textPrimary}
            multiline={false}
            numberOfLines={1}
            allowFontScaling={false}
          />

          {renderSuffix()}
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
            onLayout={handleTextLayout}
            style={[
              {
                flexShrink: 0,
                flexWrap: 'nowrap',
                fontFamily: 'Aeonik-Medium',
                position: 'absolute',
                textAlign,
                opacity: 0
              },
              textStyle
            ]}>
            {props.value || ' '}
          </Animated.Text>
        </View>
      </View>
    )
  }
)

const GAP_WIDTH = 4
