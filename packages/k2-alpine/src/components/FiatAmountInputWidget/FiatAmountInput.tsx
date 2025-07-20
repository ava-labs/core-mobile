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
import {
  InteractionManager,
  Platform,
  ReturnKeyTypeOptions,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback
} from 'react-native'
import { useTheme } from '../../hooks'
import { Text, View } from '../Primitives'
import { alpha } from '../../utils'
import { normalizeValue } from '../../utils/tokenUnitInput'
import { normalizeNumericTextInput } from '../../utils/tokenUnitInput'

export type FiatAmountInputHandle = {
  setValue: (value: string) => void
  focus: () => void
  blur: () => void
}

type FiatAmountInputProps = {
  amount?: string
  currency: string
  isAmountValid?: boolean
  formatInTokenUnit?(amount: number): string
  formatInCurrency(amount: number): string
  sx?: SxProp
  editable?: boolean
  onChange?(amount: string): void
  autoFocus?: boolean
  returnKeyType?: ReturnKeyTypeOptions
}

export const FiatAmountInput = forwardRef<
  FiatAmountInputHandle,
  FiatAmountInputProps
>(
  (
    {
      amount,
      isAmountValid = true,
      currency,
      onChange,
      formatInCurrency,
      formatInTokenUnit,
      sx,
      editable,
      returnKeyType = 'done',
      autoFocus
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ) => {
    const {
      theme: { colors }
    } = useTheme()
    const [value, setValue] = useState(amount)
    const [maxLength, setMaxLength] = useState<number>()
    const textInputRef = useRef<TextInput>(null)

    const inputAmount = useMemo(() => {
      return value?.replace(/,/g, '')
    }, [value])

    const amountInCurrency = useMemo(() => {
      return inputAmount && Number(inputAmount)
        ? formatInCurrency(Number(inputAmount))
        : ''
    }, [formatInCurrency, inputAmount])

    const displayLeadingFiatCurrency = useMemo(() => {
      return getCurrencySymbol(amountInCurrency)
    }, [amountInCurrency])

    const displayTrailingFiatCurrency = useMemo(() => {
      return amountInCurrency.endsWith(currency) ? currency : ''
    }, [amountInCurrency, currency])

    const handleValueChanged = useCallback(
      (rawValue?: string): void => {
        if (rawValue === undefined) {
          setValue('')
          onChange?.('')
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
          (!endValue || endValue.length <= 5)

        if (isInputValid) {
          const sanitizedFrontValue = frontValue.replace(/^0+(?!$)/, '')

          //setting maxLength to TextInput prevents flickering, see https://reactnative.dev/docs/textinput#value
          setMaxLength(sanitizedFrontValue.length + '.'.length + 5)

          const normalizedValue = normalizeValue(changedValue)
          setValue(normalizedValue)
          onChange?.(normalizedValue)
        } else {
          setMaxLength(undefined)
        }
      },
      [onChange]
    )

    const handlePress = (): void => {
      textInputRef.current?.focus()
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
        {formatInTokenUnit && (
          <Text
            variant="subtitle2"
            sx={{
              marginBottom: 8,
              color: isAmountValid
                ? alpha(colors.$textPrimary, 0.9)
                : colors.$textDanger
            }}>
            {formatInTokenUnit(Number(inputAmount ?? 0))}
          </Text>
        )}
        <TouchableWithoutFeedback onPress={handlePress}>
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5
            }}>
            {displayLeadingFiatCurrency && (
              <Text
                sx={{
                  ...styles.textInput,
                  lineHeight: 68,
                  color: isAmountValid
                    ? alpha(colors.$textPrimary, 0.9)
                    : colors.$textDanger
                }}>
                {displayLeadingFiatCurrency}
              </Text>
            )}
            <TextInput
              returnKeyType={returnKeyType}
              ref={textInputRef}
              editable={editable}
              style={[
                styles.textInput,
                {
                  flexShrink: 1,
                  color: isAmountValid
                    ? alpha(colors.$textPrimary, 0.9)
                    : colors.$textDanger,
                  textAlign: 'right'
                }
              ]}
              /**
               * keyboardType="numeric" causes noticeable input lag on Android.
               * Using inputMode="numeric" provides the same behavior without the performance issues.
               * See: https://github.com/expo/expo/issues/34156
               */
              keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
              inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
              placeholder={PLACEHOLDER}
              placeholderTextColor={alpha(colors.$textSecondary, 0.2)}
              value={value}
              onChangeText={handleValueChanged}
              maxLength={maxLength}
              selectionColor={colors.$textPrimary}
            />
            {displayTrailingFiatCurrency && (
              <Text
                sx={{
                  fontFamily: 'Aeonik-Medium',
                  fontSize: 24,
                  lineHeight: 24,
                  marginBottom: 8,
                  color: isAmountValid
                    ? alpha(colors.$textPrimary, 0.9)
                    : colors.$textDanger
                }}>
                {currency}
              </Text>
            )}
          </View>
        </TouchableWithoutFeedback>
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

const PLACEHOLDER = '0.00'

// returns matching currency symbol for the amount with symbol
// e.g '$' | '€' | '£' | '¥' | '₹'
function getCurrencySymbol(amountWithSymbol: string): string {
  const ScRe =
    /[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/

  return amountWithSymbol.match(ScRe)?.[0] ?? ''
}
