import React, { useEffect, useState } from 'react'
import InputText, { InputTextProps } from 'components/InputText'
import Big from 'big.js'
import { BigIntNAvax } from 'types/denominations'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { AmountChange } from 'screens/earn/types'
import { bigToBigint } from 'utils/bigNumbers/bigToBigint'

Big.PE = 99
Big.NE = -18

interface BNInputProps extends Omit<InputTextProps, 'text'> {
  value?: BigIntNAvax
  denomination: number

  onChange?(change: AmountChange): void

  onMax?(): void

  isValueLoading?: boolean
  hideErrorMessage?: boolean

  testID?: string
}

export function splitBN(val: string) {
  return val.includes('.') ? val.split('.') : [val, null]
}

/**
 * BNInput takes user's input via InputText component and calls "onChange" callback with { bn: BN; amount: string } object.
 * If there's no input, callback value is set to { bn: new BN(0), amount: '0' }.
 * Because of that, if "value" passed to BNInput is zero it is sanitized to "undefined" so that user can delete all zeroes from input.
 */
export function BigintInput({
  value,
  denomination,
  onChange,
  onMax,
  isValueLoading,
  hideErrorMessage,
  ..._props
}: BNInputProps) {
  const sanitizedValue = value && value === 0n ? undefined : value
  const valueInBaseUnit = sanitizedValue
    ? bigintToBig(sanitizedValue, denomination)
    : undefined
  const [baseValueString, setBaseValueString] = useState('')

  useEffect(updateValueStrFx, [valueInBaseUnit, baseValueString])

  const onValueChanged = (rawValue: string) => {
    if (!rawValue) {
      onChange?.({ amount: 0n, amountString: '0' })
      setBaseValueString('')
      return
    }
    const changedValue = rawValue.startsWith('.') ? '0.' : rawValue
    /**
     * Split the input and make sure the right side never exceeds
     * the denomination length
     */
    const [, endValue] = splitBN(changedValue)
    if (!endValue || endValue.length <= denomination) {
      const valueInDenomination = bigToBigint(
        new Big(changedValue),
        denomination
      )
      setBaseValueString(changedValue)
      onChange?.({
        amountString: changedValue ? new Big(changedValue).toString() : '0', // used to removing leading & trailing zeros
        amount: valueInDenomination
      })
    }
  }

  function updateValueStrFx() {
    // When deleting zeros after decimal, all zeros delete without this check.
    // This also preserves zeros in the input ui.
    if (
      (valueInBaseUnit && !baseValueString) ||
      (valueInBaseUnit &&
        baseValueString &&
        !new Big(baseValueString).eq(valueInBaseUnit))
    ) {
      setBaseValueString(valueInBaseUnit.toString())
    }
  }

  return (
    <InputText
      {..._props}
      mode={'amount'}
      keyboardType="numeric"
      onMax={onMax}
      onChangeText={onValueChanged}
      text={baseValueString}
      loading={isValueLoading}
    />
  )
}
