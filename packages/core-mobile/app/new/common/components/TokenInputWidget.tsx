import { formatTokenAmount } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { bigintToBig, bigToBigInt, TokenUnit } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  Button,
  Icons,
  normalizeNumericTextInput,
  SxProp,
  Text,
  TokenAmount,
  TokenAmountInput,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { LogoWithNetwork } from './LogoWithNetwork'
import Big from 'big.js'
import { Platform } from 'react-native'

export const TokenInputWidget = ({
  title,
  token,
  balance,
  shouldShowBalance,
  network,
  maximum,
  amount,
  onAmountChange,
  formatInCurrency,
  onSelectToken,
  onFocus,
  onBlur,
  sx,
  disabled,
  editable = true,
  inputTextColor,
  isLoadingAmount = false,
  autoFocus
}: {
  title: string
  amount?: bigint
  maximum?: bigint
  token?: { symbol: string; logoUri?: string; decimals: number }
  balance?: bigint
  shouldShowBalance?: boolean
  network?: Network
  onAmountChange: (amount: bigint) => void
  formatInCurrency: (amount: bigint | undefined) => string
  onSelectToken?: () => void
  onFocus?: () => void
  onBlur?: () => void
  sx?: SxProp
  disabled?: boolean
  editable?: boolean
  inputTextColor?: string
  isLoadingAmount?: boolean
  autoFocus?: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false)
  const [percentageButtons, setPercentageButtons] = useState<
    PercentageButton[]
  >([])

  const handlePressPercentageButton = (
    button: PercentageButton,
    index: number
  ): void => {
    let value: bigint
    if (button.value !== undefined) {
      value = button.value
    } else {
      value = BigInt(Math.floor(Number(balance ?? 0n) * button.percent))
    }

    onAmountChange?.(value)

    setPercentageButtons(prevButtons =>
      prevButtons.map((b, i) =>
        i === index ? { ...b, isSelected: true } : { ...b, isSelected: false }
      )
    )
  }

  const handleAmountChange = useCallback(
    async (value: TokenAmount): Promise<void> => {
      setPercentageButtons(prevButtons =>
        prevButtons.map(b => ({
          ...b,
          isSelected:
            balance !== undefined &&
            value.value === BigInt(Math.floor(Number(balance) * b.percent))
        }))
      )

      onAmountChange?.(value.value)
    },
    [onAmountChange, balance]
  )

  const handleFocus = (): void => {
    onFocus?.()
    setIsAmountInputFocused(true)
  }

  const handleBlur = (): void => {
    onBlur?.()
    setIsAmountInputFocused(false)
  }

  const isTokenSelectable = onSelectToken !== undefined

  useEffect(() => {
    setPercentageButtons([
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
        value: maximum,
        isSelected: false
      }
    ])
  }, [maximum])

  const inputValue = useMemo(() => {
    const selectedButton = percentageButtons.find(b => b.isSelected)

    if (selectedButton && token?.decimals && amount) {
      const unit = new TokenUnit(amount, token?.decimals, token?.symbol)
      const display = unit.toDisplay({ asNumber: true })
      const multiplier = 10 ** token.decimals

      return BigInt(Math.round(display * multiplier))
    }

    return amount
  }, [amount, percentageButtons, token?.decimals, token?.symbol])

  const nonEditableInputValue = useMemo(() => {
    if (token?.decimals && amount) {
      const unit = new TokenUnit(amount, token?.decimals, token?.symbol)
      if (unit.lt(1)) {
        return unit.toDisplay()
      }
      return unit.toDisplay({ asNumber: true })
    }

    return '0.00'
  }, [amount, token?.decimals, token?.symbol])

  return (
    <View sx={sx}>
      <Animated.View
        layout={LinearTransition.easing(Easing.inOut(Easing.cubic))}
        style={{
          backgroundColor: colors.$surfaceSecondary,
          paddingTop: 30,
          paddingHorizontal: 16,
          paddingBottom: 16
        }}>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 24
          }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {token && network && (
              <LogoWithNetwork
                token={token}
                network={network}
                outerBorderColor={colors.$surfaceSecondary}
              />
            )}
            <View sx={{ flex: 1 }}>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  justifyContent: 'space-between'
                }}>
                <TouchableOpacity
                  onPress={onSelectToken}
                  disabled={!isTokenSelectable || disabled}>
                  <View sx={{ gap: 1 }}>
                    {token && <Text variant="subtitle2">{title}</Text>}
                    <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text testID="select_token_title" variant="heading6">
                        {token
                          ? token.symbol
                          : isTokenSelectable
                          ? 'Select a token'
                          : ''}
                      </Text>
                      {isTokenSelectable && (
                        <Icons.Navigation.ExpandMore
                          width={20}
                          color={colors.$textPrimary}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  sx={{ flex: 1 }}
                  onPress={token === undefined ? onSelectToken : undefined}>
                  <View
                    sx={{
                      alignItems: 'flex-end',
                      flex: 1
                    }}
                    pointerEvents={token === undefined ? 'none' : 'auto'}>
                    {editable ? (
                      <TokenAmountInput
                        testID="token_amount_input_field"
                        autoFocus={autoFocus}
                        editable={editable}
                        denomination={token?.decimals ?? 0}
                        style={{
                          fontFamily: 'Aeonik-Medium',
                          fontSize: 42,
                          minWidth: 100,
                          width: '100%',
                          textAlign: 'right',
                          marginRight: Platform.OS === 'android' ? -4 : 0,
                          color:
                            inputTextColor ??
                            (editable
                              ? colors.$textPrimary
                              : colors.$textSecondary)
                        }}
                        value={inputValue}
                        onChange={handleAmountChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder="0.00"
                      />
                    ) : (
                      <View
                        style={{
                          height: 50,
                          width: '100%',
                          justifyContent: 'flex-end'
                        }}>
                        <Text
                          adjustsFontSizeToFit
                          numberOfLines={1}
                          style={{
                            fontFamily: 'Aeonik-Medium',
                            fontSize: 42,
                            lineHeight: 42,
                            minHeight: 42,
                            width: '100%',
                            textAlign: 'right',
                            color: !inputValue
                              ? alpha(colors.$textSecondary, 0.2)
                              : inputTextColor ??
                                (editable
                                  ? colors.$textPrimary
                                  : colors.$textSecondary)
                          }}>
                          {nonEditableInputValue}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 24,
                  justifyContent: 'space-between',
                  marginTop: Platform.OS === 'android' && editable ? -14 : -4
                }}>
                <View>
                  {token &&
                    (balance !== undefined ? (
                      <Text
                        variant="subtitle2"
                        sx={{
                          color: '$textSecondary'
                        }}>{`${formatTokenAmount(
                        bigintToBig(balance, token.decimals),
                        6
                      )} ${token.symbol}`}</Text>
                    ) : shouldShowBalance ? (
                      <View sx={{ alignSelf: 'flex-start' }}>
                        <ActivityIndicator size="small" />
                      </View>
                    ) : undefined)}
                </View>
                <View
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 1
                  }}>
                  {isLoadingAmount && <ActivityIndicator size="small" />}
                  <Text
                    variant="subtitle2"
                    numberOfLines={1}
                    sx={{
                      color: inputTextColor ?? '$textSecondary'
                    }}>
                    {formatInCurrency(amount)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View
          sx={{
            marginTop: 14
          }}>
          {isAmountInputFocused && (
            <Animated.View
              style={{
                alignSelf: 'flex-end',
                flexDirection: 'row',
                gap: 7
              }}
              entering={FadeIn}
              exiting={FadeOut}>
              {percentageButtons.map((button, index) => (
                <Button
                  key={index}
                  size="small"
                  type={button.isSelected ? 'primary' : 'secondary'}
                  style={{
                    minWidth: 72
                  }}
                  disabled={disabled || balance === undefined}
                  onPress={() => {
                    handlePressPercentageButton(button, index)
                  }}>
                  {button.text}
                </Button>
              ))}
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </View>
  )
}

type PercentageButton = {
  text: string
  percent: number
  value?: bigint
  isSelected: boolean
}
