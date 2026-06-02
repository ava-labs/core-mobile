import { SxProp } from 'dripsy'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ReturnKeyTypeOptions } from 'react-native'
import { Button } from '../Button/Button'
import { View } from '../Primitives'
import { FiatAmountInput, FiatAmountInputHandle } from './FiatAmountInput'

export interface FiatAmountInputPreset {
  label: string
  /** Numeric amount applied to the input when this preset is tapped. */
  value: number
}

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
  /**
   * Render the default `$100 / $200 / $500` quick-amount buttons. Ignored
   * when `presets` is provided — pass `presets` directly for custom labels
   * and values (e.g. `25% / 50% / Max` against a known balance).
   */
  enableAmountSelection?: boolean
  /**
   * Custom quick-amount buttons. Each preset's `label` is rendered as-is and
   * tapping sets the input to `value`. When provided, overrides
   * `enableAmountSelection` entirely.
   */
  presets?: readonly FiatAmountInputPreset[]
  /**
   * Where the subtext (`formatInSubTextNumber`) sits relative to the big
   * amount. Defaults to `'top'` to keep the existing meld onramp/offramp
   * layout untouched. Set to `'bottom'` for token-as-primary layouts where
   * the converted fiat value reads as a subtitle.
   */
  subTextPosition?: 'top' | 'bottom'
  /**
   * Maximum font size (in px) for the trailing currency label (e.g. `USDC`).
   * Useful for token-as-primary layouts where the currency tag should read
   * as a subtitle next to the big amount instead of scaling alongside it.
   * Omit to let the suffix scale with the main amount (existing behaviour).
   */
  trailingCurrencyMaxFontSize?: number
  returnKeyType?: ReturnKeyTypeOptions
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
  enableAmountSelection,
  presets,
  subTextPosition,
  trailingCurrencyMaxFontSize,
  returnKeyType
}: FiatAmountInputWidgetProps): JSX.Element => {
  const buildDefaultButtons = useCallback(
    () => [
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
    ],
    [formatIntegerCurrency]
  )

  const buildPresetButtons = useCallback(
    (items: readonly FiatAmountInputPreset[]) =>
      items.map(p => ({
        text: p.label,
        predefinedAmount: p.value,
        isSelected: false
      })),
    []
  )

  const showButtons = presets !== undefined || enableAmountSelection === true

  const [predefinedAmountButtons, setPredefinedAmountButtons] = useState<
    { text: string; predefinedAmount: number; isSelected: boolean }[]
  >(() =>
    presets
      ? buildPresetButtons(presets)
      : enableAmountSelection
      ? buildDefaultButtons()
      : []
  )

  // Custom presets can change at runtime (e.g. `Max` recomputes when balance
  // updates) — rebuild the button list when the caller hands us a new array.
  useEffect(() => {
    if (presets) {
      setPredefinedAmountButtons(buildPresetButtons(presets))
    }
  }, [presets, buildPresetButtons])

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
      if (showButtons) {
        setPredefinedAmountButtons(prevButtons =>
          prevButtons.map(b => ({
            ...b,
            isSelected: Number(value) === b.predefinedAmount
          }))
        )
      }

      onChange?.(Number(value))
    },
    [showButtons, onChange]
  )

  useEffect(() => {
    if (amount === undefined || amount === 0) {
      textInputRef.current?.setValue('')
      if (showButtons) {
        setPredefinedAmountButtons(prevButtons =>
          prevButtons.map(b => ({
            ...b,
            isSelected: false
          }))
        )
      }
    }
  }, [amount, showButtons, textInputRef])

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
          subTextPosition={subTextPosition}
          returnKeyType={returnKeyType}
          trailingCurrencyMaxFontSize={trailingCurrencyMaxFontSize}
        />
        {showButtons && (
          <View sx={{ flexDirection: 'row', gap: 7, marginTop: 16 }}>
            {predefinedAmountButtons.map((button, index) => (
              <Button
                testID={`fiat_amount_button__${button.predefinedAmount}`}
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
