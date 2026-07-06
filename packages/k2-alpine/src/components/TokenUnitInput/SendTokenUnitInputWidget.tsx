import { TokenUnit } from '@avalabs/core-utils-sdk'
import { SxProp } from 'dripsy'
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { ReturnKeyTypeOptions } from 'react-native'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { alpha } from '../../utils'
import { normalizeErrorMessage } from '../../utils/tokenUnitInput'
import { Button } from '../Button/Button'
import { Text, View } from '../Primitives'
import { TokenUnitInput, TokenUnitInputHandle } from './TokenUnitInput'

type PresetDefinition = {
  text: string
  amount: TokenUnit
}

export type SendTokenUnitInputWidgetHandle = {
  setValue: (value: string) => void
  focus: () => void
}

type SendTokenUnitInputWidgetProps = {
  amount?: TokenUnit
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
  returnKeyType?: ReturnKeyTypeOptions
  autoFocus?: boolean
  testID?: string
  maxAmount?: TokenUnit
  presetPercentages?: number[]
  balanceLabel?: string
  maxAmountZeroMessage?: string
}

export const SendTokenUnitInputWidget = forwardRef<
  SendTokenUnitInputWidgetHandle,
  SendTokenUnitInputWidgetProps
>(
  (
    {
      balance,
      token,
      amount,
      onChange,
      formatInCurrency,
      validateAmount,
      accessory,
      sx,
      disabled,
      returnKeyType,
      autoFocus,
      maxAmount,
      presetPercentages,
      balanceLabel = 'Balance:',
      maxAmountZeroMessage = "You don't have enough gas fees for this transaction"
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ) => {
    const {
      theme: { colors }
    } = useTheme()

    const [errorMessage, setErrorMessage] = useState<string>()
    const textInputRef = useRef<TokenUnitInputHandle>(null)

    useImperativeHandle(ref, () => ({
      setValue: (newValue: string) => textInputRef.current?.setValue(newValue),
      focus: () => textInputRef.current?.focus()
    }))

    // Preset targets depend only on balance/max/token — not on `amount`, so typing
    // does not rebuild this array and avoids preset button flicker.
    const presetAmountButtons = useMemo((): PresetDefinition[] => {
      const presets: PresetDefinition[] = []
      const base = maxAmount ?? balance
      if (presetPercentages && presetPercentages.length > 0) {
        presetPercentages.forEach(percentage => {
          const value = base.mul(percentage).div(100)
          presets.push({
            text: `${percentage}%`,
            amount: new TokenUnit(
              value.toSubUnit(),
              base.getMaxDecimals(),
              base.getSymbol()
            )
          })
        })
      } else {
        if (balance.gt(5)) {
          presets.push({
            text: '5 ' + token.symbol,
            amount: new TokenUnit(
              5 * 10 ** token.maxDecimals,
              balance.getMaxDecimals(),
              balance.getSymbol()
            )
          })
        }
        if (balance.gt(10)) {
          presets.push({
            text: '10 ' + token.symbol,
            amount: new TokenUnit(
              10 * 10 ** token.maxDecimals,
              balance.getMaxDecimals(),
              balance.getSymbol()
            )
          })
        }
        if (balance.gt(20)) {
          presets.push({
            text: '20 ' + token.symbol,
            amount: new TokenUnit(
              20 * 10 ** token.maxDecimals,
              balance.getMaxDecimals(),
              balance.getSymbol()
            )
          })
        }
      }

      const max = maxAmount ?? balance
      presets.push({
        text: 'Max',
        amount: max
      })

      return presets
    }, [balance, token, maxAmount, presetPercentages])

    const handleValidateAmount = useCallback(
      async (value: TokenUnit): Promise<void> => {
        if (validateAmount) {
          try {
            await validateAmount(value)

            setErrorMessage(undefined)
          } catch (e) {
            if (e instanceof Error) {
              setErrorMessage(e.message)
            }
          }
        }
      },
      [validateAmount]
    )

    const handlePressPresetButton = (amt: TokenUnit): void => {
      textInputRef.current?.setValue(amt.toString())

      onChange?.(amt)

      handleValidateAmount(amt)
    }

    const handleChange = useCallback(
      async (value: TokenUnit): Promise<void> => {
        onChange?.(value)

        handleValidateAmount(value)
      },
      [onChange, handleValidateAmount]
    )

    return (
      <View sx={{ gap: 8, ...sx }}>
        <View
          sx={{
            backgroundColor: '$surfaceSecondary',
            borderRadius: 12,
            alignItems: 'center',
            paddingTop: 32,
            paddingHorizontal: 0,
            paddingBottom: 22,
            overflow: 'hidden'
          }}>
          <TokenUnitInput
            returnKeyType={returnKeyType}
            editable={!disabled}
            ref={textInputRef}
            token={token}
            amount={amount}
            formatInCurrency={formatInCurrency}
            onChange={handleChange}
            autoFocus={autoFocus}
          />
          <View sx={{ flexDirection: 'row', gap: 7, marginTop: 25 }}>
            {presetAmountButtons.map((button, index) => {
              const isSelected =
                amount !== undefined && amount.eq(button.amount)
              return (
                <Button
                  key={index}
                  size="small"
                  type={isSelected ? 'primary' : 'secondary'}
                  style={{
                    minWidth: 72
                  }}
                  disabled={maxAmount?.eq(0)}
                  onPress={() => {
                    handlePressPresetButton(button.amount)
                  }}>
                  {button.text}
                </Button>
              )
            })}
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
            paddingHorizontal: 36,
            color: errorMessage
              ? '$textDanger'
              : alpha(colors.$textPrimary, 0.85),
            alignSelf: 'center',
            textAlign: 'center'
          }}>
          {errorMessage
            ? normalizeErrorMessage(errorMessage)
            : `${balanceLabel} ${balance.toString()} ${token.symbol}`}
        </Text>

        {/* Show additional error message if max amount is 0 */}
        {maxAmount?.eq(0) && (
          <View
            sx={{
              flexDirection: 'row',
              gap: 8,
              marginTop: 16,
              alignItems: 'center'
            }}>
            <Icons.Alert.ErrorOutline color={colors.$textDanger} />
            <Text
              sx={{
                flexShrink: 1,
                color: '$textDanger',
                fontFamily: 'Inter-Medium'
              }}>
              {maxAmountZeroMessage}
            </Text>
          </View>
        )}
      </View>
    )
  }
)
