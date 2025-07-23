import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { SxProp } from 'dripsy'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  InteractionManager,
  LayoutChangeEvent,
  Platform,
  ReturnKeyTypeOptions,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback
} from 'react-native'
import { useTheme } from '../../hooks'
import { Text, View } from '../Primitives'
import { alpha } from '../../utils'
import {
  normalizeValue,
  normalizeNumericTextInput
} from '../../utils/tokenUnitInput'

export type TokenUnitInputHandle = {
  setValue: (value: string) => void
  focus: () => void
  blur: () => void
}

type TokenUnitInputProps = {
  amount?: TokenUnit
  token: {
    maxDecimals: number
    symbol: string
  }
  formatInCurrency?(amount: TokenUnit): string
  sx?: SxProp
  editable?: boolean
  onChange?(amount: TokenUnit): void
  autoFocus?: boolean
  returnKeyType?: ReturnKeyTypeOptions
}

export const TokenUnitInput = forwardRef<
  TokenUnitInputHandle,
  TokenUnitInputProps
>(
  (
    {
      amount,
      token,
      onChange,
      formatInCurrency,
      sx,
      editable,
      returnKeyType = 'done',
      autoFocus
    },
    ref
  ) => {
    const {
      theme: { colors }
    } = useTheme()
    const [value, setValue] = useState(amount?.toDisplay())
    const [maxLength, setMaxLength] = useState<number>()
    const textInputRef = useRef<TextInput>(null)
    const [textInputMinimumLayout, setTextInputMinimumLayout] = useState<{
      width: number
      height: number
    }>()

    const inputAmount = useMemo(() => {
      const sanitizedValue = value?.replace(/,/g, '')
      return new TokenUnit(
        !sanitizedValue ? 0n : Number(sanitizedValue) * 10 ** token.maxDecimals,
        token.maxDecimals,
        token.symbol
      )
    }, [value, token])

    const handleValueChanged = useCallback(
      (rawValue: string): void => {
        if (!rawValue) {
          setValue('')
          onChange?.(new TokenUnit(0n, token.maxDecimals, token.symbol))
          return
        }

        // Normalize the input to handle locale-specific decimal separators
        const normalizedInput = normalizeNumericTextInput(rawValue)
        const changedValue = normalizedInput.startsWith('.')
          ? '0.'
          : normalizedInput

        /**
         * Split the input and make sure the right side never exceeds
         * the maxDecimals length
         */
        const [frontValue, endValue] = changedValue.split('.')

        // Checks if the input is a valid numeric string and that its decimal part
        // does not exceed the allowed maximum number of decimal digits.
        const isInputValid =
          frontValue !== undefined &&
          !isNaN(Number(changedValue)) &&
          (!endValue || endValue.length <= token.maxDecimals)

        if (isInputValid) {
          const sanitizedFrontValue = frontValue.replace(/^0+(?!$)/, '')

          //setting maxLength to TextInput prevents flickering, see https://reactnative.dev/docs/textinput#value
          setMaxLength(
            sanitizedFrontValue.length + '.'.length + token.maxDecimals
          )

          const normalizedValue = normalizeValue(changedValue)

          setValue(normalizedValue)
          onChange?.(
            new TokenUnit(
              Number(normalizedValue) * 10 ** token.maxDecimals,
              token.maxDecimals,
              token.symbol
            )
          )
        } else {
          setMaxLength(undefined)
        }
      },
      [onChange, token.maxDecimals, token.symbol]
    )

    const handlePress = (): void => {
      textInputRef.current?.focus()
    }

    const handleTextInputLayout = (event: LayoutChangeEvent): void => {
      setTextInputMinimumLayout(event.nativeEvent.layout)
    }

    useImperativeHandle(ref, () => ({
      setValue: (newValue: string) => setValue(newValue),
      focus: () => textInputRef.current?.focus(),
      blur: () => textInputRef.current?.blur()
    }))

    useEffect(() => {
      if (autoFocus) {
        InteractionManager.runAfterInteractions(() => {
          textInputRef.current?.focus()
        })
      }
    }, [autoFocus])

    return (
      <View
        sx={{
          alignItems: 'center',
          ...sx
        }}>
        <TouchableWithoutFeedback onPress={handlePress}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 5
            }}>
            <Text
              onLayout={handleTextInputLayout}
              style={[
                styles.textInput,
                { position: 'absolute', top: 0, opacity: 0 }
              ]}>
              {PLACEHOLDER}
            </Text>
            <TextInput
              testID="token_amount_input_field"
              returnKeyType={returnKeyType}
              ref={textInputRef}
              editable={editable}
              style={[
                styles.textInput,
                {
                  flexShrink: 1,
                  color: colors.$textPrimary,
                  textAlign: 'right',
                  minWidth: textInputMinimumLayout?.width
                }
              ]}
              /**
               * keyboardType="numeric" causes noticeable input lag on Android.
               * Using inputMode="numeric" provides the same behavior without the performance issues.
               * See: https://github.com/expo/expo/issues/34156
               */
              keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : undefined}
              inputMode={Platform.OS === 'android' ? 'decimal' : undefined}
              placeholder={PLACEHOLDER}
              placeholderTextColor={alpha(colors.$textSecondary, 0.2)}
              value={value}
              onChangeText={handleValueChanged}
              maxLength={maxLength}
              selectionColor={colors.$textPrimary}
            />
            <Text
              sx={{
                fontFamily: 'Aeonik-Medium',
                fontSize: 24,
                lineHeight: 24,
                marginTop: SYMBOL_MARGIN_TOP
              }}>
              {token.symbol}
            </Text>
          </View>
        </TouchableWithoutFeedback>
        {formatInCurrency && (
          <Text
            variant="subtitle2"
            sx={{ marginTop: 0, color: alpha(colors.$textPrimary, 0.9) }}>
            {formatInCurrency(inputAmount)}
          </Text>
        )}
      </View>
    )
  }
)

const styles = StyleSheet.create({
  textInput: {
    fontFamily: 'Aeonik-Medium',
    fontSize: 60
  }
})

const PLACEHOLDER = '0.0'

const SYMBOL_MARGIN_TOP = Platform.OS === 'ios' ? 14 : 20
