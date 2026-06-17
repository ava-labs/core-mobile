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
  StyleProp,
  TextInput,
  TextStyle,
  TouchableWithoutFeedback
} from 'react-native'
import {
  computeMaxLength,
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
  /**
   * Where the subtext node (`formatInSubTextNumber`) renders relative to the
   * big amount. Defaults to `'top'` to preserve the existing onramp/offramp
   * layout where the converted token amount sits above the fiat input.
   */
  subTextPosition?: 'top' | 'bottom'
  suffixStyle?: StyleProp<TextStyle>
  prefixStyle?: StyleProp<TextStyle>
}

const BIG_AMOUNT_FONT_SIZE = 60

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
      subTextPosition = 'top',
      suffixStyle,
      prefixStyle,
      ...props
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ): JSX.Element => {
    const [value, setValue] = useState(amount)
    const [maxLength, setMaxLength] = useState<number>()
    const textInputRef = useRef<TextInput>(null)

    const inputAmount = useMemo(() => {
      return value?.replace(/,/g, '')
    }, [value])

    const amountInCurrency = useMemo(() => {
      return formatInCurrency(Number(inputAmount))
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
          (!endValue || endValue.length <= FIAT_MAX_DECIMALS)

        if (isInputValid) {
          const normalizedValue = normalizeValue(changedValue)

          //setting maxLength to TextInput prevents flickering, see https://reactnative.dev/docs/textinput#value
          setMaxLength(computeMaxLength(normalizedValue, FIAT_MAX_DECIMALS))

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
      setValue: (newValue: string) => {
        setValue(newValue)
        setMaxLength(computeMaxLength(newValue, FIAT_MAX_DECIMALS))
      },
      focus: () => textInputRef.current?.focus(),
      blur: () => textInputRef.current?.blur()
    }))

    const subTextNode = formatInSubTextNumber?.(Number(inputAmount ?? 0))

    return (
      <View
        sx={{
          alignItems: 'center',
          ...sx
        }}>
        {subTextPosition === 'top' ? subTextNode : null}
        <TouchableWithoutFeedback accessible={false} onPress={handlePress}>
          <View
            accessible={false}
            style={{
              paddingHorizontal: 16,
              width: '100%'
            }}>
            <AutoSizeTextInput
              {...props}
              ref={textInputRef}
              value={value}
              testID="fiat_amount_input"
              onChangeText={handleValueChanged}
              initialFontSize={BIG_AMOUNT_FONT_SIZE}
              textAlign="right"
              prefix={displayLeadingFiatCurrency}
              suffix={displayTrailingFiatCurrency}
              suffixFontSizeMultiplier={0.5}
              suffixStyle={suffixStyle}
              prefixStyle={prefixStyle}
              placeholder={`${PLACEHOLDER}`}
              maxLength={maxLength}
              returnKeyType={returnKeyType}
              editable={editable}
              valid={isAmountValid}
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
        {subTextPosition === 'bottom' ? subTextNode : null}
      </View>
    )
  }
)

const PLACEHOLDER = '0.00'
const FIAT_MAX_DECIMALS = 5

// returns matching currency symbol for the amount with symbol
// e.g '$' | '€' | '£' | '¥' | '₹'
function getCurrencySymbol(amountWithSymbol: string): string {
  const ScRe =
    /[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/

  // Empty string when no fiat symbol is detected — lets callers that format
  // amounts with a token name (e.g. `"1.50 USDC"`) render without a spurious
  // leading `$`.
  return amountWithSymbol.match(ScRe)?.[0] ?? ''
}
