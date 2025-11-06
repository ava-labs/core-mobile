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
  /** Cpntainer style */
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
  /** Always show prefix and suffix */
  alwaysShowPrefixAndSuffix?: boolean
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
      initialFontSize = 36,
      maxLength = 20,
      prefix,
      suffix,
      textAlign,
      containerSx,
      prefixSx,
      suffixSx,
      alwaysShowPrefixAndSuffix,
      renderLeft,
      renderRight,
      onChangeText,
      ...props
    },
    ref
  ): JSX.Element => {
    const { theme } = useTheme()

    const [containerWidth, setContainerWidth] = useState(0)
    const [leftWidth, setLeftWidth] = useState(0)
    const [rightWidth, setRightWidth] = useState(0)

    const isFocused = useSharedValue(false)

    const animatedFontSize = useSharedValue(initialFontSize)
    const inputRef = useRef<TextInput>(null)
    const lastTextRef = useRef<string>('')

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      setNativeProps: (_props: TextInputProps) =>
        inputRef.current?.setNativeProps(_props)
    }))

    const textStyle = useAnimatedStyle(() => {
      return {
        textAlign,
        fontFamily: 'Aeonik-Medium',
        fontSize: animatedFontSize.value,
        lineHeight: animatedFontSize.value * 1.1
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
        newFontSize = Math.max(10, Math.min(initialFontSize, newFontSize))

        if (Math.abs(newFontSize - animatedFontSize.value) > 0.5) {
          animatedFontSize.value = newFontSize
        }
      },
      [
        leftWidth,
        rightWidth,
        animatedFontSize,
        containerWidth,
        prefix,
        suffix,
        initialFontSize,
        renderLeft,
        renderRight
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

      if (
        prefix &&
        (alwaysShowPrefixAndSuffix ||
          (props.value && props?.value?.length >= 1))
      ) {
        return (
          <Pressable onPress={focusTextInput} onLayout={handleLeftLayout}>
            <Animated.Text
              style={[
                textStyle,
                props.style,
                prefixSx,
                {
                  color:
                    props?.value && props?.value?.length > 0
                      ? theme.colors.$textPrimary
                      : alpha(theme.colors.$textSecondary, 0.2)
                }
              ]}>
              {prefix}
            </Animated.Text>
          </Pressable>
        )
      }
    }, [
      alwaysShowPrefixAndSuffix,
      focusTextInput,
      handleLeftLayout,
      prefix,
      prefixSx,
      props.style,
      props.value,
      renderLeft,
      textStyle,
      theme.colors.$textPrimary,
      theme.colors.$textSecondary
    ])

    const renderSuffix = useCallback(() => {
      if (renderRight) {
        return (
          <Pressable onPress={focusTextInput} onLayout={handleRightLayout}>
            {renderRight()}
          </Pressable>
        )
      }

      if (
        suffix &&
        (alwaysShowPrefixAndSuffix ||
          (props.value && props?.value?.length >= 1))
      ) {
        return (
          <Pressable onPress={focusTextInput} onLayout={handleRightLayout}>
            <Animated.Text
              style={[
                textStyle,
                props.style,
                suffixSx,
                {
                  color:
                    props?.value && props?.value?.length > 0
                      ? theme.colors.$textPrimary
                      : alpha(theme.colors.$textSecondary, 0.2)
                }
              ]}>
              {suffix}
            </Animated.Text>
          </Pressable>
        )
      }
    }, [
      alwaysShowPrefixAndSuffix,
      focusTextInput,
      handleRightLayout,
      props.style,
      props.value,
      renderRight,
      suffix,
      suffixSx,
      textStyle,
      theme.colors.$textPrimary,
      theme.colors.$textSecondary
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
            onBlur={onBlurTextInput}
            onFocus={onFocusTextInput}
            onChangeText={onChangeText}
            placeholderTextColor={alpha(theme.colors.$textSecondary, 0.2)}
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
