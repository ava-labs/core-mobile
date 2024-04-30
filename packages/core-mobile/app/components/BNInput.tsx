import React, { useEffect, useState } from 'react'
import InputText, { InputTextProps } from 'components/InputText'
import Big from 'big.js'
import BN from 'bn.js'
import { bigToBN, bnToBig } from '@avalabs/utils-sdk'

interface BNInputProps extends Omit<InputTextProps, 'text'> {
  value?: BN
  denomination: number

  onChange?(val: { bn: BN; amount: string }): void

  onMax?(): void

  isValueLoading?: boolean
  hideErrorMessage?: boolean

  testID?: string
}

export function splitBN(val: string): (string | null)[] {
  return val.includes('.') ? val.split('.') : [val, null]
}

/**
 * BNInput takes user's input via InputText component and calls "onChange" callback with { bn: BN; amount: string } object.
 * If there's no input, callback value is set to { bn: new BN(0), amount: '0' }.
 * Because of that, if "value" passed to BNInput is zero it is sanitized to "undefined" so that user can delete all zeroes from input.
 */
export function BNInput({
  value,
  denomination,
  onChange,
  onMax,
  isValueLoading,
  hideErrorMessage,
  ..._props
}: BNInputProps): JSX.Element {
  const [valueAsString, setValueAsString] = useState('')
  const valueBig = value ? bnToBig(value, denomination) : undefined

  useEffect(() => {
    // When deleting zeros after decimal, all zeros delete without this check.
    // This also preserves zeros in the input ui.
    if (valueBig && (!valueAsString || !new Big(valueAsString).eq(valueBig))) {
      setValueAsString(valueBig.toString())
    }
  }, [valueBig, valueAsString, value])

  const onValueChanged = (rawValue: string): void => {
    if (!rawValue) {
      onChange?.({ bn: new BN(0), amount: '0' })
      setValueAsString('')
      return
    }
    const changedValue = rawValue.startsWith('.') ? '0.' : rawValue
    /**
     * Split the input and make sure the right side never exceeds
     * the denomination length
     */
    const [, endValue] = splitBN(changedValue)
    if (!endValue || endValue.length <= denomination) {
      const valueToBn = bigToBN(new Big(changedValue), denomination)
      setValueAsString(changedValue)
      onChange?.({
        amount: changedValue ? new Big(changedValue).toString() : '0', // used to removing leading & trailing zeros
        bn: valueToBn
      })
    }
  }

  return (
    <InputText
      {..._props}
      mode={'amount'}
      keyboardType="numeric"
      onMax={onMax}
      onChangeText={onValueChanged}
      text={valueAsString}
      loading={isValueLoading}
    />
  )
}
