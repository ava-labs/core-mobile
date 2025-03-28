import React, { useEffect, useMemo, useState } from 'react'
import { SxProp, TextInput } from 'dripsy'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useTheme } from '../../../hooks'
import { Text, View } from '../../Primitives'
import { alpha } from '../../../utils'
import { Button } from '../../Button/Button'

export const StakingAmountInput = ({
  balanceInAvax,
  minStakeAmount,
  value,
  onChange,
  formatInCurrency,
  externalError,
  sx
}: {
  value?: TokenUnit
  minStakeAmount: TokenUnit
  balanceInAvax: TokenUnit
  onChange?(amount: TokenUnit): void
  formatInCurrency(amount: TokenUnit): string
  externalError?: Error
  sx?: SxProp
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const sanitizedValue = value && value.isZero() ? undefined : value
  const [baseValueString, setBaseValueString] = useState('')
  const [maxLength, setMaxLength] = useState<number>()
  const { maxTokenDecimals, maxDecimalDigits, tokenSymbol } = useMemo(() => {
    return {
      maxTokenDecimals: balanceInAvax.getMaxDecimals(),
      maxDecimalDigits: getMaxDecimals(balanceInAvax),
      tokenSymbol: balanceInAvax.getSymbol()
    }
  }, [balanceInAvax])
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
  const [error, setError] = useState<string>()

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

  const inputAmountInTokenUnit = useMemo(() => {
    return new TokenUnit(
      baseValueString === ''
        ? 0
        : Number(baseValueString) * 10 ** maxTokenDecimals,
      maxTokenDecimals,
      tokenSymbol
    )
  }, [baseValueString, maxTokenDecimals, tokenSymbol])

  const handleValueChanged = (rawValue: string): void => {
    setPercentageButtons(prevButtons =>
      prevButtons.map(b => ({ ...b, isSelected: false }))
    )

    if (!rawValue) {
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
      !isNaN(Number(changedValue)) &&
      (!endValue ||
        endValue.length <= Math.min(maxDecimalDigits, maxTokenDecimals))
    ) {
      //setting maxLength to TextInput prevents flickering, see https://reactnative.dev/docs/textinput#value
      setMaxLength(
        frontValue.length +
          '.'.length +
          Math.min(maxDecimalDigits, maxTokenDecimals)
      )

      setBaseValueString(changedValue)
    } else {
      setMaxLength(undefined)
    }
  }

  const handlePressPercentageButton = (
    percent: number,
    index: number
  ): void => {
    // we can't stake the full amount because of fees
    // to give a good user experience, when user presses max
    // we will stake 99.99% of the balance
    // this is to ensure that the user has enough balance to cover the fees
    const amount = balanceInAvax.mul(Math.min(percent, 0.9999))
    setBaseValueString(amount.toDisplay())

    setPercentageButtons(prevButtons =>
      prevButtons.map((b, i) =>
        i === index ? { ...b, isSelected: true } : { ...b, isSelected: false }
      )
    )
  }

  useEffect(updateValueStrFx, [baseValueString, sanitizedValue])

  useEffect(() => {
    onChange?.(inputAmountInTokenUnit)
  }, [inputAmountInTokenUnit, onChange])

  useEffect(() => {
    if (
      !inputAmountInTokenUnit.isZero() &&
      inputAmountInTokenUnit.lt(minStakeAmount)
    ) {
      setError(`Minimum amount to stake is ${minStakeAmount.toString()} AVAX`)
    } else if (inputAmountInTokenUnit.gt(balanceInAvax)) {
      setError('The specified staking amount exceeds the available balance')
    } else if (externalError) {
      setError(externalError.message)
    } else {
      setError(undefined)
    }
  }, [inputAmountInTokenUnit, minStakeAmount, balanceInAvax, externalError])

  return (
    <View sx={{ gap: 8, ...sx }}>
      <View
        sx={{
          backgroundColor: '$surfaceSecondary',
          borderRadius: 12,
          alignItems: 'center',
          paddingTop: 35,
          paddingHorizontal: 16,
          paddingBottom: 22
        }}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 5
          }}>
          <TextInput
            sx={{
              fontFamily: 'Aeonik-Medium',
              fontSize: 60,
              flexShrink: 1,
              color: colors.$textPrimary
            }}
            keyboardType="numeric"
            placeholder="0.0"
            autoFocus={true}
            value={baseValueString}
            onChangeText={handleValueChanged}
            maxLength={maxLength}
            selectionColor={colors.$textPrimary}
          />
          <Text
            sx={{
              fontFamily: 'Aeonik-Medium',
              fontSize: 24,
              lineHeight: 24,
              marginTop: 14
            }}>
            AVAX
          </Text>
        </View>
        <Text
          variant="subtitle2"
          sx={{ marginTop: 5, color: alpha(colors.$textPrimary, 0.9) }}>
          {formatInCurrency(inputAmountInTokenUnit)}
        </Text>
        <View sx={{ flexDirection: 'row', gap: 7, marginTop: 25 }}>
          {percentageButtons.map((button, index) => (
            <Button
              key={index}
              size="small"
              type={button.isSelected ? 'primary' : 'secondary'}
              style={{ minWidth: 72 }}
              onPress={() => {
                handlePressPercentageButton(button.percent, index)
              }}>
              {button.text}
            </Button>
          ))}
        </View>
      </View>
      <Text
        variant="caption"
        sx={{
          color: error ? '$textDanger' : alpha(colors.$textPrimary, 0.85),
          alignSelf: 'center'
        }}>
        {error ? error : `Balance: ${balanceInAvax.toDisplay()} AVAX`}
      </Text>
    </View>
  )
}

const MAX_DIGITS = 7

function getMaxDecimals(input: TokenUnit): number {
  const stringAmount = input.toString().replaceAll(',', '')
  const [whole] = stringAmount.split('.')
  const maxDecimals = MAX_DIGITS - (whole?.length ?? 0)
  if (maxDecimals < 0) return 0
  return maxDecimals
}
