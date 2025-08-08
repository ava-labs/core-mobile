import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react'
import { SxProp } from 'dripsy'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { ReturnKeyTypeOptions } from 'react-native'
import { normalizeErrorMessage } from '../../utils/tokenUnitInput'
import { useTheme } from '../../hooks'
import { Text, View } from '../Primitives'
import { alpha } from '../../utils'
import { Button } from '../Button/Button'
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
      autoFocus
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

    const presetAmounts = useMemo(() => {
      const presets = []
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
      presets.push({
        text: 'Max',
        amount: balance,
        isSelected: false
      })
      return presets
    }, [balance, token.maxDecimals, token.symbol])

    useImperativeHandle(ref, () => ({
      setValue: (newValue: string) => textInputRef.current?.setValue(newValue)
    }))

    useEffect(() => {
      setPresetAmonuntButtons(presetAmounts)
    }, [presetAmounts])

    const handlePressPresetButton = (amt: TokenUnit, index: number): void => {
      textInputRef.current?.setValue(amt.toDisplay())

      onChange?.(amt)

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
      [onChange, validateAmount, balance]
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
                disabled={disabled}
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
      </View>
    )
  }
)
