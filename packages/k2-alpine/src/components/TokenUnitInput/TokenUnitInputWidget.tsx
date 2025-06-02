import React, { useCallback, useRef, useState } from 'react'
import { SxProp } from 'dripsy'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { View } from '../Primitives'
import { Button } from '../Button/Button'
import { TokenUnitInput, TokenUnitInputHandle } from './TokenUnitInput'

export const TokenUnitInputWidget = ({
  balance,
  token,
  maxPercentage = 1,
  amount,
  onChange,
  formatInCurrency,
  accessory,
  sx,
  disabled,
  autoFocus
}: {
  amount?: TokenUnit
  maxPercentage?: number
  balance: TokenUnit
  token: {
    maxDecimals: number
    symbol: string
  }
  onChange?(amount: TokenUnit): void
  formatInCurrency(amount: TokenUnit): string
  validateAmount?(amount: TokenUnit): Promise<void>
  accessory?: JSX.Element
  sx?: SxProp
  disabled?: boolean
  autoFocus?: boolean
}): JSX.Element => {
  const [percentageButtons, setPercentageButtons] = useState<
    { text: string; percent: number; isSelected: boolean }[]
  >([
    {
      text: '25%',
      percent: 0.25,
      isSelected: false
    },
    {
      text: '50%',
      percent: 0.5,
      isSelected: false
    },
    {
      text: 'Max',
      percent: maxPercentage,
      isSelected: false
    }
  ])
  const textInputRef = useRef<TokenUnitInputHandle>(null)

  const handlePressPercentageButton = (
    percent: number,
    index: number
  ): void => {
    const value = balance.mul(percent)
    textInputRef.current?.setValue(value.toDisplay())

    onChange?.(
      new TokenUnit(
        Number(value.toDisplay({ asNumber: true })) * 10 ** token.maxDecimals,
        token.maxDecimals,
        token.symbol
      )
    )

    setPercentageButtons(prevButtons =>
      prevButtons.map((b, i) =>
        i === index ? { ...b, isSelected: true } : { ...b, isSelected: false }
      )
    )
  }

  const handleChange = useCallback(
    async (value: TokenUnit): Promise<void> => {
      setPercentageButtons(prevButtons =>
        prevButtons.map(b => ({
          ...b,
          isSelected: value.toDisplay() === balance.mul(b.percent).toDisplay()
        }))
      )

      onChange?.(value)
    },
    [onChange, balance]
  )

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
        <TokenUnitInput
          editable={!disabled}
          ref={textInputRef}
          token={token}
          amount={amount}
          autoFocus={autoFocus}
          onChange={handleChange}
          formatInCurrency={formatInCurrency}
        />
        <View sx={{ flexDirection: 'row', gap: 7, marginTop: 25 }}>
          {percentageButtons.map((button, index) => (
            <Button
              key={index}
              size="small"
              type={button.isSelected ? 'primary' : 'secondary'}
              style={{
                minWidth: 72
              }}
              disabled={disabled}
              onPress={() => {
                handlePressPercentageButton(button.percent, index)
              }}>
              {button.text}
            </Button>
          ))}
        </View>
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
