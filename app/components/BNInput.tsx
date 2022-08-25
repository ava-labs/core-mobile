import React, { useEffect, useState } from 'react'
import { TextInputProps, View } from 'react-native'
import InputText from 'components/InputText'
import Big from 'big.js'
import BN from 'bn.js'

Big.PE = 99
Big.NE = -18
const big10 = new BN(10)

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
 * Simple function that takes in an input value and parses it to its correct BN value.
 * For example give a 1 with a denomination of 5 you would get a BN of 10000 and a 1.2 with same
 * denomination you will get 1.20000
 *
 * split the value, get the left side and apply BN algo, get right side and apply BN algo. Then
 * add them together and return
 *
 * @param val The value to parse as BN
 * @param denomination The right side denomination
 * @returns BN
 */
export function getAmountBN(val: number | string, denomination: number): BN {
  const bigDemoniation = new BN(denomination || 0)
  const [beginningValue, endValue] = splitBN(val.toString())

  const bigLeftSide = beginningValue
    ? new BN(beginningValue).mul(big10.pow(bigDemoniation))
    : new BN(0)

  const bigRightSide = endValue
    ? new BN(endValue).mul(
        big10.pow(bigDemoniation.sub(new BN(endValue.split('').length)))
      )
    : new BN(0)

  try {
    return bigRightSide ? bigLeftSide.add(bigRightSide) : bigLeftSide
  } catch (e) {
    console.log('error when parsing input: ', e)
    return new BN(0)
  }
}

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
  const [valStr, setValStr] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  useEffect(() => {
    if (value) {
      const valueAsBig = new Big(value.toString()).div(
        Math.pow(10, denomination)
      )

      /**
       * When deleting zeros after decimal, all zeros delete without this check.
       * This also preserves zeros in the input ui.
       */

      if (
        (!valStr || !valueAsBig.eq(valStr)) &&
        valueAsBig.toString() !== '0'
      ) {
        setValStr(valueAsBig.toString())
      }
    } else {
      setValStr('')
    }
    // Only trigger when `value` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (max && valStr && getAmountBN(valStr, denomination).gt(max)) {
      hideErrorMessage || setErrorMessage('Insufficient balance')
    } else {
      setErrorMessage('')
    }
  }, [valStr, max, denomination])

  useEffect(() => {
    if (valStr && onError) {
      onError(errorMessage)
    }
    // Ignore onError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valStr, errorMessage])

  const onValueChanged = (rawValue: string) => {
    const changedValue = rawValue.startsWith('.') ? '0.' : rawValue
    /**
     * Split the input and make sure the right side never exceeds
     * the denomination length
     */
    const [, endValue] = splitBN(changedValue)
    if (!endValue || endValue.length <= denomination) {
      const valueToBn = getAmountBN(changedValue, denomination)
      if (!valueToBn.eq(getAmountBN(valStr, denomination))) {
        onChange?.({
          // used to removing leading & trailing zeros
          amount: changedValue ? new Big(changedValue).toString() : '0',
          bn: valueToBn
        })
      }
      setValStr(changedValue)
    }
  }

  const setMax = () => {
    if (!max) {
      return
    }

    const big = new Big(max.toString()).div(Math.pow(10, denomination))
    onValueChanged(big.toString())
  }

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      <InputText
        {..._props}
        mode={'amount'}
        keyboardType="numeric"
        onMax={max && setMax}
        onChangeText={onValueChanged}
        text={valStr}
        loading={isValueLoading}
      />
    </View>
  )
}
