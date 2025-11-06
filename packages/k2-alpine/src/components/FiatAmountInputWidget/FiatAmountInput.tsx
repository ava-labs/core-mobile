import { SxProp } from 'dripsy'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import {
  Platform,
  ReturnKeyTypeOptions,
  TextInput,
  TouchableWithoutFeedback
} from 'react-native'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import {
  normalizeNumericTextInput,
  normalizeValue
} from '../../utils/tokenUnitInput'
import { AutoSizeTextInput } from '../AutoSizeTextInput/AutoSizeTextInput'
import { View } from '../Primitives'

export type FiatAmountInputHandle = {
  setValue: (value: string) => void
  focus: () => void
  blur: () => void
}

type FiatAmountInputProps = {
  amount?: string
  currency: string
  isAmountValid?: boolean
  formatInSubTextNumber?(amount: number): JSX.Element
  formatInCurrency(amount: number): string
  sx?: SxProp
  editable?: boolean
  onChange?(amount: string): void
  autoFocus?: boolean
  placeholder?: string
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
      formatInSubTextNumber,
      sx,
      placeholder,
      editable,
      returnKeyType = 'done',
      autoFocus,
      ...props
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): JSX.Element => {
    const { theme } = useTheme()
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
      return amountInCurrency.endsWith(currency) ? currency : undefined
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

    useEffect(() => {
      if (autoFocus) {
        requestAnimationFrame(() => {
          textInputRef.current?.focus()
        })
      }
    }, [autoFocus])

    useImperativeHandle(ref, () => ({
      setValue: (newValue: string) => setValue(newValue),
      focus: () => textInputRef.current?.focus(),
      blur: () => textInputRef.current?.blur()
    }))

    return (
      <View
        sx={{
          alignItems: 'center',
          ...sx
        }}>
        {formatInSubTextNumber?.(Number(inputAmount ?? 0))}
        <TouchableWithoutFeedback onPress={handlePress} style={{}}>
          <View
            style={{
              paddingHorizontal: 16,
              width: '100%'
            }}>
            <AutoSizeTextInput
              {...props}
              ref={textInputRef}
              value={value}
              accessibilityLabel="fiat_amount_input"
              testID="fiat_amount_input"
              onChangeText={handleValueChanged}
              initialFontSize={60}
              textAlign="right"
              prefix={displayLeadingFiatCurrency}
              suffix={displayTrailingFiatCurrency}
              placeholder={`${getCurrencySymbol(
                amountInCurrency
              )}${PLACEHOLDER}`}
              // TODO: Decide if we set it as max 20 or keep original logic
              maxLength={maxLength}
              returnKeyType={returnKeyType}
              editable={editable}
              style={[
                {
                  color: isAmountValid
                    ? alpha(theme.colors.$textPrimary, 0.9)
                    : theme.colors.$textDanger
                }
              ]}
              /**
               * keyboardType="numeric" causes noticeable input lag on Android.
               * Using inputMode="numeric" provides the same behavior without the performance issues.
               * See: https://github.com/expo/expo/issues/34156
               */
              keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
              inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
            />
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }
)

const PLACEHOLDER = '0.00'

// returns matching currency symbol for the amount with symbol
// e.g '$' | '€' | '£' | '¥' | '₹'
function getCurrencySymbol(amountWithSymbol: string): string {
  const ScRe =
    /[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/

  return amountWithSymbol.match(ScRe)?.[0] ?? ''
}
