import React, { useEffect, useState } from 'react'
import { TextInputProps, View } from 'react-native'
import InputText from 'components/InputText'
import Big from 'big.js'
import BN from 'bn.js'
import { bigToBN, bnToBig } from '@avalabs/utils-sdk'

Big.PE = 99
Big.NE = -18

interface BNInputProps
  extends Omit<
    TextInputProps,
    'max' | 'min' | 'value' | 'onChange' | 'onError'
  > {
  value?: BN
  denomination: number

  onChange?(val: { bn: BN; amount: string }): void

  placeholder?: string
  min?: BN
  max?: BN
  isValueLoading?: boolean
  hideErrorMessage?: boolean
  onError?: (errorMessage: string) => void
}

export function splitBN(val: string) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  min = new BN(0),
  max,
  isValueLoading,
  hideErrorMessage,
  onError,
  ..._props
}: BNInputProps) {
  const sanitizedValue = value?.isZero() ? undefined : value
  const [errorMessage, setErrorMessage] = useState('')
  const [valueAsString, setValueAsString] = useState('')
  const valueBig = sanitizedValue
    ? bnToBig(sanitizedValue, denomination)
    : undefined

  useEffect(updateValueStrFx, [valueBig, valueAsString])
  useEffect(checkBalanceFx, [hideErrorMessage, max, sanitizedValue])
  useEffect(() => {
    if (sanitizedValue && onError) {
      onError(errorMessage)
    }
  }, [sanitizedValue, errorMessage, onError])

  const onValueChanged = (rawValue: string) => {
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

  const setMax = () => {
    if (!max) {
      return
    }

    const big = new Big(max.toString()).div(Math.pow(10, denomination))
    onValueChanged(big.toString())
  }

  function updateValueStrFx() {
    // When deleting zeros after decimal, all zeros delete without this check.
    // This also preserves zeros in the input ui.
    if (
      (valueBig && !valueAsString) ||
      (valueBig && valueAsString && !new Big(valueAsString).eq(valueBig))
    ) {
      setValueAsString(valueBig.toString())
    }
  }

  function checkBalanceFx() {
    return () => {
      if (max && sanitizedValue && sanitizedValue.gt(max)) {
        hideErrorMessage || setErrorMessage('Insufficient balance')
      } else {
        setErrorMessage('')
      }
    }
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      <InputText
        {..._props}
        mode={'amount'}
        keyboardType="numeric"
        onMax={max && setMax}
        onChangeText={onValueChanged}
        text={valueAsString}
        loading={isValueLoading}
      />
    </View>
  )
}
