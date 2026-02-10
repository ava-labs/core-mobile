import { SxProp } from 'dripsy'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import {
  TextInputProps as _TextInputProps,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
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
  /** Test ID */
  testID?: string
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
      onBlur,
      onFocus,
      editable = true,
      valid = true,
      testID,
      value,
      style,
      ...props
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): JSX.Element => {
    const { theme } = useTheme()

    const [containerWidth, setContainerWidth] = useState(0)
    const leftWidthRef = useRef(0)
    const rightWidthRef = useRef(0)
    const lastTextWidthRef = useRef(0)
    const prevContainerWidthRef = useRef(0)

    const hasValue = useSharedValue(false)
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

    // Update hasValue shared value synchronously during render
    hasValue.value = (value?.length ?? 0) > 0

    const textStyle = useAnimatedStyle(() => {
      return {
        textAlign,
        fontFamily: 'Aeonik-Medium',
        fontSize: animatedFontSize.value,
        lineHeight: animatedFontSize.value * 1.1,
        color: hasValue.value ? textColor : placeholderTextColor
      }
    })

    const inputTextStyle = useAnimatedStyle(() => {
      const fontSize = animatedFontSize.value * FIT_SCALE_FACTOR
      return {
        textAlign,
        fontFamily: 'Aeonik-Medium',
        fontSize,
        lineHeight: fontSize * 1.1,
        color: hasValue.value ? textColor : placeholderTextColor
      }
    })

    const suffixTextStyle = useAnimatedStyle(() => {
      return {
        fontFamily: 'Aeonik-Medium',
        fontSize: animatedSuffixFontSize.value,
        lineHeight: animatedSuffixFontSize.value * 1.1,
        color: hasValue.value ? textColor : placeholderTextColor
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
          leftWidthRef.current -
          rightWidthRef.current -
          totalGapWidth -
          (Platform.OS === 'ios' ? 32 : 8)

        if (availableWidth <= 0) return

        // On iOS, the calculated font size doesn't fully fill the container width.
        // This 1.1x correction factor increases the font size to better utilize the available space.
        const correctionFactor = Platform.OS === 'ios' ? 1.1 : 1

        const ratio = (availableWidth / textWidth) * correctionFactor
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

    const handleLayout = useCallback(
      (e: LayoutChangeEvent): void => {
        const newWidth = e.nativeEvent.layout.width
        const widthDiff = Math.abs(newWidth - prevContainerWidthRef.current)

        // Ignore minor width changes caused by font size adjustments
        if (widthDiff >= LAYOUT_CHANGE_THRESHOLD) {
          prevContainerWidthRef.current = newWidth
          setContainerWidth(newWidth)

          if (lastTextWidthRef.current > 0) {
            calculateAndUpdateFontSize(lastTextWidthRef.current)
          }
        }
      },
      [calculateAndUpdateFontSize]
    )

    const handleLeftLayout = useCallback((e: LayoutChangeEvent): void => {
      leftWidthRef.current = e.nativeEvent.layout.width
    }, [])

    const handleRightLayout = useCallback((e: LayoutChangeEvent): void => {
      rightWidthRef.current = e.nativeEvent.layout.width
    }, [])

    const handleTextLayout = useCallback(
      (e: LayoutChangeEvent): void => {
        const textWidth = e.nativeEvent.layout.width

        // Always keep the measured width up to date (even when text hasn't changed,
        // e.g. after a font size adjustment), so handleLayout can use it accurately
        if (textWidth > 0) {
          lastTextWidthRef.current = textWidth
        }

        // Only recalculate font size when the text content actually changed
        const currentText = value || ''
        if (lastTextRef.current === currentText) {
          return
        }

        lastTextRef.current = currentText

        // Short text fits at initial size — skip measurement and reset
        if (currentText.length < MIN_LENGTH_TO_RESIZE) {
          animatedFontSize.value = initialFontSize
          animatedSuffixFontSize.value =
            initialFontSize * suffixFontSizeMultiplier
          return
        }

        if (textWidth > 0 && containerWidth > 0) {
          calculateAndUpdateFontSize(textWidth)
        }
      },
      [
        containerWidth,
        value,
        calculateAndUpdateFontSize,
        animatedFontSize,
        animatedSuffixFontSize,
        initialFontSize,
        suffixFontSizeMultiplier
      ]
    )

    // Handles initial sizing when containerWidth becomes available
    // after text width has already been recorded
    useEffect(() => {
      if (containerWidth > 0 && lastTextWidthRef.current > 0) {
        calculateAndUpdateFontSize(lastTextWidthRef.current)
      }
    }, [containerWidth, calculateAndUpdateFontSize])

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

    return (
      <View
        sx={{
          ...containerSx,
          minHeight: initialFontSize + 12,
          justifyContent: 'center'
        }}>
        <View onLayout={handleLayout} style={styles.row}>
          {renderPrefix()}

          <AnimatedTextInput
            {...props}
            ref={inputRef}
            testID={testID}
            value={value}
            style={[styles.input, inputTextStyle, style]}
            maxLength={maxLength}
            editable={editable}
            onBlur={onBlur}
            onFocus={onFocus}
            onChangeText={onChangeText}
            placeholderTextColor={placeholderTextColor}
            selectionColor={theme.colors.$textPrimary}
            multiline={false}
            numberOfLines={1}
            allowFontScaling={false}
          />

          {renderSuffix()}
        </View>

        {/* Hidden text for measuring content width */}
        <View style={styles.measurementContainer} pointerEvents="none">
          <Animated.Text
            numberOfLines={1}
            onLayout={handleTextLayout}
            style={[styles.measurementText, textStyle]}>
            {value || ' '}
          </Animated.Text>
        </View>
      </View>
    )
  }
)

const GAP_WIDTH = 4

// Scale factor to keep input text slightly smaller than full available width
const FIT_SCALE_FACTOR = 0.885

// Text shorter than this resets to initialFontSize without measuring
const MIN_LENGTH_TO_RESIZE = 4

// Threshold (in pixels) to distinguish real layout changes (focus/blur, rotation) from
// minor fluctuations caused by font size adjustments
const LAYOUT_CHANGE_THRESHOLD = 10

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GAP_WIDTH
  },
  input: {
    padding: 0
  },
  measurementContainer: {
    position: 'absolute',
    opacity: 0
  },
  measurementText: {
    flexShrink: 0,
    flexWrap: 'nowrap',
    fontFamily: 'Aeonik-Medium',
    position: 'absolute'
  }
})
