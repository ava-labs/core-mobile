import React, { useEffect, useCallback, useRef, useState } from 'react'
import { SxProp } from 'dripsy'
import { View } from '../Primitives'
import { Button } from '../Button/Button'
import { FiatAmountInput, FiatAmountInputHandle } from './FiatAmountInput'

interface FiatAmountInputWidgetProps {
  currency: string
  isAmountValid?: boolean
  formatInSubTextNumber?(amount: number): JSX.Element
  formatInCurrency(amount: number): string
  formatIntegerCurrency(amount: number): string
  amount?: number
  onChange?(amount: number): void
  accessory?: JSX.Element
  sx?: SxProp
  disabled?: boolean
  autoFocus?: boolean
  enableAmountSelection?: boolean
}

export const FiatAmountInputWidget = ({
  amount,
  isAmountValid = true,
  onChange,
  formatInCurrency,
  formatIntegerCurrency,
  formatInSubTextNumber,
  currency,
  accessory,
  sx,
  disabled,
  autoFocus,
  enableAmountSelection
}: FiatAmountInputWidgetProps): JSX.Element => {
  const [predefinedAmountButtons, setPredefinedAmountButtons] = useState<
    { text: string; predefinedAmount: number; isSelected: boolean }[]
  >(
    enableAmountSelection
      ? [
          {
            text: formatIntegerCurrency(100),
            predefinedAmount: 100,
            isSelected: false
          },
          {
            text: formatIntegerCurrency(200),
            predefinedAmount: 200,
            isSelected: false
          },
          {
            text: formatIntegerCurrency(500),
            predefinedAmount: 500,
            isSelected: false
          }
        ]
      : []
  )
  const textInputRef = useRef<FiatAmountInputHandle>(null)

  const handlePressPredefinedAmountButton = useCallback(
    (predefinedAmount: number, index: number): void => {
      textInputRef.current?.setValue(predefinedAmount.toString())

      onChange?.(predefinedAmount)

      setPredefinedAmountButtons(prevButtons =>
        prevButtons.map((b, i) =>
          i === index ? { ...b, isSelected: true } : { ...b, isSelected: false }
        )
      )
    },
    [onChange]
  )

  const handleChange = useCallback(
    (value: string): void => {
      enableAmountSelection &&
        setPredefinedAmountButtons(prevButtons =>
          prevButtons.map(b => ({
            ...b,
            isSelected: Number(value) === b.predefinedAmount
          }))
        )

      onChange?.(Number(value))
    },
    [enableAmountSelection, onChange]
  )

  useEffect(() => {
    if (amount === undefined || amount === 0) {
      textInputRef.current?.setValue('')
      enableAmountSelection &&
        setPredefinedAmountButtons(prevButtons =>
          prevButtons.map(b => ({
            ...b,
            isSelected: false
          }))
        )
    }
  }, [amount, enableAmountSelection, textInputRef])

  return (
    <View sx={sx}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          borderRadius: 12,
          alignItems: 'center',
          paddingTop: 32,
          paddingHorizontal: 16,
          paddingBottom: 22
        }}>
        <FiatAmountInput
          isAmountValid={isAmountValid}
          ref={textInputRef}
          autoFocus={autoFocus}
          currency={currency}
          amount={amount && amount !== 0 ? amount?.toString() : ''}
          onChange={handleChange}
          formatInCurrency={formatInCurrency}
          formatInSubTextNumber={formatInSubTextNumber}
        />
        {enableAmountSelection && (
          <View sx={{ flexDirection: 'row', gap: 7, marginTop: 25 }}>
            {predefinedAmountButtons.map((button, index) => (
              <Button
                key={index}
                size="small"
                type={button.isSelected ? 'primary' : 'secondary'}
                style={{
                  minWidth: 72
                }}
                disabled={disabled}
                onPress={() => {
                  handlePressPredefinedAmountButton(
                    button.predefinedAmount,
                    index
                  )
                }}>
                {button.text}
              </Button>
            ))}
          </View>
        )}
        {accessory !== undefined && (
          <View
            sx={{
              position: 'absolute',
              right: 8,
              top: 60
            }}>
            {accessory}
          </View>
        )}
      </View>
    </View>
  )
}
