import React, { useCallback, useRef, useState } from 'react'
import { SxProp } from 'dripsy'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useTheme } from '../../hooks'
import { Text, View } from '../Primitives'
import { alpha } from '../../utils'
import { Button } from '../Button/Button'
import { TokenAmountInput, TokenAmountInputHandle } from './TokenAmountInput'

export const TokenAmountInputWidget = ({
  balance,
  token,
  maxPercentage = 1,
  amount,
  onChange,
  formatInCurrency,
  validateAmount,
  accessory,
  sx
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
  validateAmount?(amount: TokenUnit): void
  accessory?: JSX.Element
  sx?: SxProp
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
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
      percent: 1,
      isSelected: false
    }
  ])
  const [errorMessage, setErrorMessage] = useState<string>()
  const textInputRef = useRef<TokenAmountInputHandle>(null)

  const handlePressPercentageButton = (
    percent: number,
    index: number
  ): void => {
    const value = balance.mul(Math.min(percent, maxPercentage))
    textInputRef.current?.setValue(value.toDisplay())

    setPercentageButtons(prevButtons =>
      prevButtons.map((b, i) =>
        i === index ? { ...b, isSelected: true } : { ...b, isSelected: false }
      )
    )
  }

  const handleChange = useCallback(
    (value: TokenUnit): void => {
      setPercentageButtons(prevButtons =>
        prevButtons.map(b => ({ ...b, isSelected: false }))
      )

      onChange?.(value)

      if (validateAmount) {
        try {
          validateAmount(value)

          setErrorMessage(undefined)
        } catch (e) {
          if (e instanceof Error) {
            setErrorMessage(e.message)
          }
        }
      }
    },
    [onChange, validateAmount]
  )

  return (
    <View sx={{ gap: 8, ...sx }}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          borderRadius: 12,
          alignItems: 'center',
          paddingTop: 32,
          paddingHorizontal: 16,
          paddingBottom: 22
        }}>
        <TokenAmountInput
          ref={textInputRef}
          token={token}
          amount={amount}
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
      <Text
        variant="caption"
        sx={{
          color: errorMessage
            ? '$textDanger'
            : alpha(colors.$textPrimary, 0.85),
          alignSelf: 'center'
        }}>
        {errorMessage
          ? errorMessage
          : `Balance: ${balance.toDisplay()} ${token.symbol}`}
      </Text>
    </View>
  )
}
