import React, { useCallback, useRef, useState } from 'react'
import { Sx, SxProp } from 'dripsy'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { View } from '../Primitives'
import { Button } from '../Button/Button'
import { TokenUnitInput, TokenUnitInputHandle } from './TokenUnitInput'

export interface TokenUnitInputPreset {
  label: string
  /**
   * Display amount applied to the input when this preset is tapped
   * (e.g. `100` for 100 tokens). Ignored when `percent` is set.
   */
  value?: number
  /**
   * Fraction of the live `balance` applied when tapped (e.g. `0.25` for 25%).
   * Unlike `value`, this tracks `balance` prop updates after mount.
   */
  percent?: number
}

// Internal button model. A button either applies a fixed display `value`
// (custom `presets`) or a `percent` of the balance (default 25/50/Max).
type AmountButton = {
  text: string
  isSelected: boolean
  value?: number
  percent?: number
}

export const TokenUnitInputWidget = ({
  balance,
  token,
  maxPercentage = 1,
  amount,
  onChange,
  formatInCurrency,
  accessory,
  sx,
  cardSx,
  disabled,
  autoFocus,
  presets,
  valid = true
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
  accessory?: JSX.Element
  sx?: SxProp
  /**
   * Overrides for the inner card (e.g. a fixed `height`). Typed as the plain
   * object form (`Sx`, not `SxProp`) because it's spread into the card's sx —
   * a function-form `SxProp` would silently contribute nothing.
   */
  cardSx?: Sx
  disabled?: boolean
  autoFocus?: boolean
  /** When false, the amount renders in the danger color. */
  valid?: boolean
  /**
   * Custom quick-amount buttons, either fixed display amounts (e.g.
   * `$100 / $250 / $500` via `value`) or balance fractions (e.g.
   * `25% / 50% / 100%` via `percent`). When provided, overrides the default
   * `25% / 50% / Max` percentage buttons.
   */
  presets?: readonly TokenUnitInputPreset[]
}): JSX.Element => {
  const [buttons, setButtons] = useState<AmountButton[]>(() =>
    presets && presets.length > 0
      ? presets.map(p => ({
          text: p.label,
          value: p.value,
          percent: p.percent,
          isSelected: false
        }))
      : [
          { text: '25%', percent: 0.25, isSelected: false },
          { text: '50%', percent: 0.5, isSelected: false },
          { text: 'Max', percent: maxPercentage, isSelected: false }
        ]
  )
  const textInputRef = useRef<TokenUnitInputHandle>(null)

  const handlePressButton = (button: AmountButton, index: number): void => {
    // Build the TokenUnit without a float round-trip: percentage presets come
    // straight from `balance.mul` (bigint math), fixed presets round to the
    // nearest subunit. Going through `displayValue * 10 ** decimals` could
    // diverge by a subunit from the bigint parsing `TokenUnitInput` uses.
    const valueUnit =
      button.value !== undefined
        ? new TokenUnit(
            Math.round(button.value * 10 ** token.maxDecimals),
            token.maxDecimals,
            token.symbol
          )
        : balance.mul(button.percent ?? 0)
    // A zero result (e.g. a percentage of an empty balance) would replace the
    // placeholder with a literal "0" and highlight the button — keep it a no-op.
    if (valueUnit.isZero()) {
      return
    }
    textInputRef.current?.setValue(
      valueUnit.toDisplay({ asNumber: true }).toString()
    )

    onChange?.(valueUnit)

    setButtons(prevButtons =>
      prevButtons.map((b, i) =>
        i === index ? { ...b, isSelected: true } : { ...b, isSelected: false }
      )
    )
  }

  const handleChange = useCallback(
    async (value: TokenUnit): Promise<void> => {
      setButtons(prevButtons =>
        prevButtons.map(b => ({
          ...b,
          isSelected:
            b.value !== undefined
              ? value.toDisplay({ asNumber: true }) === b.value
              : value.toDisplay() === balance.mul(b.percent ?? 0).toDisplay()
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
          paddingBottom: 22,
          ...cardSx
        }}>
        <TokenUnitInput
          editable={!disabled}
          ref={textInputRef}
          token={token}
          amount={amount}
          autoFocus={autoFocus}
          onChange={handleChange}
          formatInCurrency={formatInCurrency}
          returnKeyType="none"
          valid={valid}
        />
        <View sx={{ flexDirection: 'row', gap: 7, marginTop: 25 }}>
          {buttons.map((button, index) => (
            <Button
              key={index}
              size="small"
              type={button.isSelected ? 'primary' : 'secondary'}
              style={{
                minWidth: 72
              }}
              disabled={disabled}
              onPress={() => {
                handlePressButton(button, index)
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
