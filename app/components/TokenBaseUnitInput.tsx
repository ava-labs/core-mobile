import React, { useEffect, useState } from 'react'
import InputText, { InputTextProps } from 'components/InputText'
import { AcceptedTypes, TokenBaseUnit } from 'types/TokenBaseUnit'

interface TokenBaseUnitProps<T extends TokenBaseUnit<T>>
  extends Omit<InputTextProps, 'text'> {
  value?: T
  denomination: number
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
  denomination,
  baseUnitConstructor,
  onChange,
  onMax,
  isValueLoading,
  hideErrorMessage,
  ..._props
}: TokenBaseUnitProps<T>) {
  const sanitizedValue = value && value.isZero() ? undefined : value
  const [baseValueString, setBaseValueString] = useState('')

  useEffect(updateValueStrFx, [baseValueString, sanitizedValue])

  const onValueChanged = (rawValue: string) => {
    if (!rawValue) {
      onChange?.(new baseUnitConstructor(0, denomination))
      setBaseValueString('')
      return
    }
    const changedValue = rawValue.startsWith('.') ? '0.' : rawValue

    /**
     * Split the input and make sure the right side never exceeds
     * the denomination length
     */
    const [, endValue] = changedValue.includes('.')
      ? changedValue.split('.')
      : [changedValue, null]
    if (!endValue || endValue.length <= denomination) {
      setBaseValueString(changedValue)
      onChange?.(new baseUnitConstructor(changedValue, denomination))
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
