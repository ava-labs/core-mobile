import React, { useEffect, useState } from 'react'
import Big from 'big.js'
import { bigintToBig, bigToBigInt } from '@avalabs/core-utils-sdk'
import { TextInput, TextInputProps } from 'react-native'
import {
  normalizeNumericTextInput,
  splitIntegerAndFraction
} from '../../utils/tokenUnitInput'
import { useTheme } from '../../hooks'

/**
 * TokenAmountInput takes user's input via InputText component and calls "onChange" callback with { value: bigint; valueString: string } object.
 * If there's no input, callback value is set to { value: new BigInt(0), valueString: '0' }.
 * Because of that, if "value" passed to TokenAmountInput is zero it is sanitized to "undefined" so that user can delete all zeroes from input.
 */
export function TokenAmountInput({
  value,
  denomination,
  onChange,
  isLoading,
  hideErrorMessage,
  ...props
}: TokenAmountInputProps): JSX.Element {
  const { theme } = useTheme()
  const [valueAsString, setValueAsString] = useState('')
  const valueBig = value ? bigintToBig(value, denomination) : undefined

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

  return (
    <TextInput
      {...props}
      keyboardType="numeric"
      onChangeText={handleChangeText}
      value={valueAsString}
      selectionColor={theme.colors.$textPrimary}
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
