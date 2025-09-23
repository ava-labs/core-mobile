import { bigintToBig, bigToBigInt } from '@avalabs/core-utils-sdk'
import Big from 'big.js'
import React, { useEffect, useRef, useState } from 'react'
import { Platform, TextInput, TextInputProps } from 'react-native'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import {
  normalizeNumericTextInput,
  splitIntegerAndFraction
} from '../../utils/tokenUnitInput'

/**
 * TokenAmountInput takes user's input via InputText component and calls "onChange" callback with { value: bigint; valueString: string } object.
 * If there's no input, callback value is set to { value: new BigInt(0), valueString: '0' }.
 * Because of that, if "value" passed to TokenAmountInput is zero it is sanitized to "undefined" so that user can delete all zeroes from input.
 */
export const TokenAmountInput = ({
  value,
  denomination,
  onChange,
  isLoading,
  hideErrorMessage,
  autoFocus,
  ...props
}: TokenAmountInputProps): JSX.Element => {
  const { theme } = useTheme()
  const [valueAsString, setValueAsString] = useState('')
  const valueBig = value ? bigintToBig(value, denomination) : undefined
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    // When deleting zeros after decimal, all zeros delete without this check.
    // This also preserves zeros in the input ui.
    if (valueBig && (!valueAsString || !new Big(valueAsString).eq(valueBig))) {
      setValueAsString(valueBig.toString())
    } else if (value === undefined) {
      setValueAsString('')
    }
  }, [valueBig, valueAsString, value])

  const handleChangeText = (rawValue: string): void => {
    const valueText = normalizeNumericTextInput(rawValue)
    if (!valueText) {
      onChange?.({ value: 0n, valueString: '0' })
      setValueAsString('')
      return
    }
    const changedValue = valueText.startsWith('.') ? '0.' : valueText

    /**
     * Split the input and make sure the right side never exceeds
     * the denomination length
     */
    const [, endValue] = splitIntegerAndFraction(changedValue)
    if (!endValue || endValue.length <= denomination) {
      const valueToBigInt = bigToBigInt(new Big(changedValue), denomination)

      setValueAsString(changedValue)
      onChange?.({
        valueString: changedValue ? new Big(changedValue).toString() : '0', // used to removing leading & trailing zeros
        value: valueToBigInt
      })
    }
  }

  useEffect(() => {
    if (autoFocus) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [autoFocus])

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current?.setNativeProps({ text: valueAsString })
    }
  }, [valueAsString])

  return (
    <TextInput
      {...props}
      ref={inputRef}
      /**
       * keyboardType="numeric" causes noticeable input lag on Android.
       * Using inputMode="numeric" provides the same behavior without the performance issues.
       * See: https://github.com/expo/expo/issues/34156
       */
      keyboardType={Platform.OS === 'ios' ? 'numeric' : undefined}
      inputMode={Platform.OS === 'android' ? 'numeric' : undefined}
      onChangeText={handleChangeText}
      numberOfLines={1}
      placeholderTextColor={alpha(theme.colors.$textSecondary, 0.2)}
      selectionColor={theme.colors.$textPrimary}
      allowFontScaling={false}
      style={[{ color: theme.colors.$textPrimary }, props.style]}
    />
  )
}

interface TokenAmountInputProps
  extends Omit<TextInputProps, 'onChange' | 'value'> {
  value?: bigint
  denomination: number

  onChange?(val: TokenAmount): void

  isLoading?: boolean
  hideErrorMessage?: boolean

  testID?: string
}

export type TokenAmount = { value: bigint; valueString: string }
