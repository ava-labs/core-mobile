import { TokenUnit } from '@avalabs/core-utils-sdk'
import { SxProp } from 'dripsy'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
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

interface PresetAmount {
  text: string
  amount: TokenUnit
  isSelected: boolean
}

export type SendTokenUnitInputWidgetHandle = {
  setValue: (value: string) => void
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
      presetPercentages
    },
    ref
    // eslint-disable-next-line sonarjs/cognitive-complexity
  ) => {
    const {
      theme: { colors }
    } = useTheme()

    const [errorMessage, setErrorMessage] = useState<string>()
    const textInputRef = useRef<TokenUnitInputHandle>(null)
    const [presetAmonuntButtons, setPresetAmonuntButtons] = useState<
      PresetAmount[]
    >([])

    useImperativeHandle(ref, () => ({
      setValue: (newValue: string) => textInputRef.current?.setValue(newValue)
    }))

    useEffect(() => {
      const presets = []
      if (presetPercentages && presetPercentages.length > 0) {
        presetPercentages.forEach(percentage => {
          const value = balance.mul(percentage).div(100)
          presets.push({
            text: `${percentage}%`,
            amount: new TokenUnit(
              value.toSubUnit(),
              balance.getMaxDecimals(),
              balance.getSymbol()
            ),
            isSelected: amount
              ? amount.toSubUnit() === value.toSubUnit()
              : false
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
            ),
            isSelected: false
          })
        }
        if (balance.gt(10)) {
          presets.push({
            text: '10 ' + token.symbol,
            amount: new TokenUnit(
              10 * 10 ** token.maxDecimals,
              balance.getMaxDecimals(),
              balance.getSymbol()
            ),
            isSelected: false
          })
        }
        if (balance.gt(20)) {
          presets.push({
            text: '20 ' + token.symbol,
            amount: new TokenUnit(
              20 * 10 ** token.maxDecimals,
              balance.getMaxDecimals(),
              balance.getSymbol()
            ),
            isSelected: false
          })
        }
      }

      const max = maxAmount ?? balance
      presets.push({
        text: 'Max',
        amount: max,
        isSelected: amount ? amount.toSubUnit() === max.toSubUnit() : false
      })

      setPresetAmonuntButtons(presets)
    }, [balance, token, maxAmount, presetPercentages, amount])

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

    const handlePressPresetButton = (amt: TokenUnit, index: number): void => {
      textInputRef.current?.setValue(amt.toDisplay())

      onChange?.(amt)

      handleValidateAmount(amt)

      setPresetAmonuntButtons(prevButtons =>
        prevButtons.map((b, i) =>
          i === index ? { ...b, isSelected: true } : { ...b, isSelected: false }
        )
      )
    }

    const handleChange = useCallback(
      async (value: TokenUnit): Promise<void> => {
        setPresetAmonuntButtons(prevButtons =>
          prevButtons.map(b => ({
            ...b,
            isSelected: value.eq(balance.mul(b.amount))
          }))
        )

        onChange?.(value)

        handleValidateAmount(value)
      },
      [onChange, balance, handleValidateAmount]
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
            {presetAmonuntButtons.map((button, index) => (
              <Button
                key={index}
                size="small"
                type={button.isSelected ? 'primary' : 'secondary'}
                style={{
                  minWidth: 72
                }}
                disabled={maxAmount?.eq(0)}
                onPress={() => {
                  handlePressPresetButton(button.amount, index)
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
            paddingHorizontal: 36,
            color: errorMessage
              ? '$textDanger'
              : alpha(colors.$textPrimary, 0.85),
            alignSelf: 'center',
            textAlign: 'center'
          }}>
          {errorMessage
            ? normalizeErrorMessage(errorMessage)
            : `Balance: ${balance.toDisplay()} ${token.symbol}`}
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
              You don't have enough gas fees for this transaction
            </Text>
          </View>
        )}
      </View>
    )
  }
)
