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
  LayoutChangeEvent,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback
} from 'react-native'
import { useTheme } from '../../hooks'
import { Text, View } from '../Primitives'
import { alpha } from '../../utils'
import { getMaxDecimals, normalizeValue } from '../../utils/tokenUnitInput'

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
  onChange?(amount: TokenUnit): void
  formatInCurrency?(amount: TokenUnit): string
  sx?: SxProp
  editable?: boolean
}

export const TokenUnitInput = forwardRef<
  TokenUnitInputHandle,
  TokenUnitInputProps
>(({ amount, token, onChange, formatInCurrency, sx, editable }, ref) => {
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
    return new TokenUnit(
      !value ? 0 : Number(value) * 10 ** token.maxDecimals,
      token.maxDecimals,
      token.symbol
    )
  }, [value, token])
  const maxDecimalDigits = useMemo(() => {
    return getMaxDecimals(inputAmount) ?? inputAmount.getMaxDecimals()
  }, [inputAmount])

  const handleValueChanged = useCallback(
    (rawValue: string): void => {
      if (!rawValue) {
        setValue('')
        return
      }
      const changedValue = rawValue.startsWith('.') ? '0.' : rawValue

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
        (!endValue ||
          endValue.length <= Math.min(maxDecimalDigits, token.maxDecimals))

      if (isInputValid) {
        const sanitizedFrontValue = frontValue.replace(/^0+(?!$)/, '')

        //setting maxLength to TextInput prevents flickering, see https://reactnative.dev/docs/textinput#value
        setMaxLength(
          sanitizedFrontValue.length +
            '.'.length +
            Math.min(maxDecimalDigits, token.maxDecimals)
        )

        setValue(normalizeValue(changedValue))
      } else {
        setMaxLength(undefined)
      }
    },
    [maxDecimalDigits, token]
  )

  const handlePress = (): void => {
    textInputRef.current?.focus()
  }

  const handleTextInputLayout = (event: LayoutChangeEvent): void => {
    setTextInputMinimumLayout(event.nativeEvent.layout)
  }

  useEffect(() => {
    onChange?.(inputAmount)
  }, [inputAmount, onChange])

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
            keyboardType="numeric"
            placeholder={PLACEHOLDER}
            autoFocus={true}
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
              marginTop: 14
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
})

const styles = StyleSheet.create({
  textInput: {
    fontFamily: 'Aeonik-Medium',
    fontSize: 60
  }
})

const PLACEHOLDER = '0.0'
