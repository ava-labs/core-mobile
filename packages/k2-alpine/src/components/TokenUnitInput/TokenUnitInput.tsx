import { TokenUnit } from '@avalabs/core-utils-sdk'
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
import { Text, View } from '../Primitives'
import { AutoSizeTextInput } from '../AutoSizeTextInput/AutoSizeTextInput'

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
            Math.min(
              20,
              sanitizedFrontValue.length + '.'.length + token.maxDecimals
            )
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

    useImperativeHandle(ref, () => ({
      setValue: (newValue: string) => setValue(newValue),
      focus: () => textInputRef.current?.focus(),
      blur: () => textInputRef.current?.blur()
    }))

    useEffect(() => {
      if (autoFocus) {
        requestAnimationFrame(() => {
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
          <View style={{ paddingHorizontal: 0, width: '100%' }}>
            <AutoSizeTextInput
              testID="token_amount_input_field"
              accessibilityLabel="token_amount_input_field"
              accessible={true}
              ref={textInputRef}
              editable={editable}
              placeholder={PLACEHOLDER}
              value={value}
              textAlign="right"
              suffixFontSizeMultiplier={0.5}
              onChangeText={handleValueChanged}
              returnKeyType={returnKeyType}
              maxLength={maxLength}
              initialFontSize={60}
              suffix={token.symbol}
              suffixSx={{
                marginBottom: 20
              }}
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

const PLACEHOLDER = '0.00'
