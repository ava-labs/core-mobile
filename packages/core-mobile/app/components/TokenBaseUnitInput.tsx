import React, { useEffect, useState } from 'react'
import InputText, { InputTextProps } from 'components/InputText'
import { AcceptedTypes, TokenBaseUnit } from 'types/TokenBaseUnit'

interface TokenBaseUnitProps<T extends TokenBaseUnit<T>>
  extends Omit<InputTextProps, 'text'> {
  value?: T
  maxDecimals: number
  isValueLoading?: boolean
  hideErrorMessage?: boolean
  testID?: string
  // Used to construct concrete class, extender of TokenBaseUnit
  baseUnitConstructor: new (value: AcceptedTypes, maxDecimals: number) => T

  onChange?(amount: T): void

  onMax?(): void
}

/**
 * BaseAvaxInput takes user's input via InputText component and calls "onChange" callback with TokenBaseUnit object.
 * Users input is kept in baseValueString.
 * Since TokenBaseUnit object will strip trailing decimal zeroes this component will compare "value" param with
 * baseValueString using TokenBaseUnit.eq() operation to detect if there are any changes.
 */
export function TokenBaseUnitInput<T extends TokenBaseUnit<T>>({
  value,
  maxDecimals,
  baseUnitConstructor,
  onChange,
  onMax,
  isValueLoading,
  hideErrorMessage,
  ..._props
}: TokenBaseUnitProps<T>) {
  const sanitizedValue = value && value.isZero() ? undefined : value
  const [baseValueString, setBaseValueString] = useState('')
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined)

  useEffect(updateValueStrFx, [baseValueString, sanitizedValue])

  const onValueChanged = (rawValue: string) => {
    if (!rawValue) {
      onChange?.(new baseUnitConstructor(0, maxDecimals))
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
    if (!endValue || endValue.length <= maxDecimals) {
      //setting maxLength to TextInput prevents flickering, see https://reactnative.dev/docs/textinput#value
      setMaxLength(frontValue.length + '.'.length + maxDecimals)

      setBaseValueString(changedValue)
      onChange?.(new baseUnitConstructor(changedValue, maxDecimals))
    } else {
      setMaxLength(undefined)
    }
  }

  function updateValueStrFx() {
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
