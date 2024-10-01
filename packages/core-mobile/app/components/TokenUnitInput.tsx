import React, { useEffect, useState } from 'react'
import InputText, { InputTextProps } from 'components/InputText'
import { TokenUnit } from '@avalabs/core-utils-sdk'

interface TokenUnitInputProps extends Omit<InputTextProps, 'text'> {
  value?: TokenUnit
  maxTokenDecimals: number
  maxDecimalDigits: number
  tokenSymbol: string
  isValueLoading?: boolean
  hideErrorMessage?: boolean
  testID?: string
  // Used to construct concrete class, extender of TokenBaseUnit

  onChange?(amount: TokenUnit): void

  onMax?(): void
}

/**
 * TokenUnitInput takes user's input via InputText component and calls "onChange" callback with TokenUnit object.
 * Users input is kept in baseValueString.
 * Since TokenUnit object will strip trailing decimal zeroes this component will compare "value" param with
 * baseValueString using TokenUnit.eq() operation to detect if there are any changes.
 */
export function TokenUnitInput({
  value,
  maxTokenDecimals,
  maxDecimalDigits,
  tokenSymbol,
  onChange,
  onMax,
  isValueLoading,
  hideErrorMessage,
  ..._props
}: TokenUnitInputProps): JSX.Element {
  const sanitizedValue = value && value.isZero() ? undefined : value
  const [baseValueString, setBaseValueString] = useState('')
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined)

  useEffect(updateValueStrFx, [baseValueString, sanitizedValue])

  const onValueChanged = (rawValue: string): void => {
    if (!rawValue) {
      onChange?.(new TokenUnit(0, maxTokenDecimals, tokenSymbol))
      setBaseValueString('')
      return
    }
    const changedValue = rawValue.startsWith('.') ? '0.' : rawValue

    /**
     * Split the input and make sure the right side never exceeds
     * the maxDecimals length
     */
    const [frontValue, endValue] = changedValue.includes('.')
      ? changedValue.split('.')
      : [changedValue, null]
    if (
      !endValue ||
      endValue.length <= Math.min(maxDecimalDigits, maxTokenDecimals)
    ) {
      //setting maxLength to TextInput prevents flickering, see https://reactnative.dev/docs/textinput#value
      setMaxLength(
        frontValue.length +
          '.'.length +
          Math.min(maxDecimalDigits, maxTokenDecimals)
      )

      setBaseValueString(changedValue)
      onChange?.(
        new TokenUnit(
          Number(changedValue) * 10 ** maxTokenDecimals,
          maxTokenDecimals,
          tokenSymbol
        )
      )
    } else {
      setMaxLength(undefined)
    }
  }

  function updateValueStrFx(): void {
    // When deleting zeros after decimal, all zeros delete without this check.
    // This also preserves zeros in the input ui.
    if (
      (sanitizedValue && !baseValueString) ||
      (sanitizedValue && baseValueString && !sanitizedValue.eq(baseValueString))
    ) {
      setBaseValueString(sanitizedValue.toString())
    }
  }

  return (
    <InputText
      testID="token_base_unit_input"
      {..._props}
      mode={'amount'}
      maxLength={maxLength}
      keyboardType="numeric"
      onMax={onMax}
      onChangeText={onValueChanged}
      text={baseValueString}
      loading={isValueLoading}
    />
  )
}
