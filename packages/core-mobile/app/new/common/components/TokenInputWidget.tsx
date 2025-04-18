import React, { useCallback, useState } from 'react'
import {
  Button,
  Icons,
  SxProp,
  Text,
  TokenAmount,
  TokenAmountInput,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Network } from '@avalabs/core-chains-sdk'
import { formatTokenAmount } from '@avalabs/core-bridge-sdk'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition
} from 'react-native-reanimated'
import { LogoWithNetwork } from './LogoWithNetwork'

export const TokenInputWidget = ({
  title,
  token,
  balance,
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
  inputTextColor
}: {
  title: string
  amount?: bigint
  maximum?: bigint
  token?: { symbol: string; logoUri?: string; decimals: number }
  balance?: bigint
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
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false)
  const [percentageButtons, setPercentageButtons] = useState<
    PercentageButton[]
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
      value: maximum,
      isSelected: false
    }
  ])

  const handlePressPercentageButton = (
    button: PercentageButton,
    index: number
  ): void => {
    if (button.value !== undefined) {
      onAmountChange?.(button.value)
    } else {
      const value = Number(balance ?? 0n) * button.percent

      onAmountChange?.(button.value ?? BigInt(value))
    }

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
          isSelected: value.value === BigInt(Number(balance ?? 0n) * b.percent)
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
            justifyContent: 'space-between',
            gap: 12
          }}>
          <TouchableOpacity
            onPress={onSelectToken}
            disabled={!isTokenSelectable}>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {token && network && (
                <LogoWithNetwork
                  token={token}
                  network={network}
                  outerBorderColor={colors.$surfaceSecondary}
                />
              )}
              <View sx={{ gap: 1 }}>
                {token && <Text variant="subtitle2">{title}</Text>}
                <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    variant="heading6"
                    sx={{
                      marginTop: 0
                    }}>
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
                {balance !== undefined && token && (
                  <Text
                    variant="subtitle2"
                    sx={{
                      color: '$textSecondary'
                    }}>{`${formatTokenAmount(
                    bigintToBig(balance, token.decimals),
                    6
                  )} ${token.symbol}`}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexShrink: 1 }}
            onPress={token === undefined ? onSelectToken : undefined}>
            <View
              sx={{ alignItems: 'flex-end' }}
              pointerEvents={token === undefined ? 'none' : 'auto'}>
              <TokenAmountInput
                editable={editable}
                denomination={token?.decimals ?? 0}
                style={{
                  fontFamily: 'Aeonik-Medium',
                  fontSize: 42,
                  minWidth: 100,
                  textAlign: 'right',
                  color:
                    inputTextColor ??
                    (editable ? colors.$textPrimary : colors.$textSecondary)
                }}
                value={amount}
                onChange={handleAmountChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="0.00"
              />
              <Text
                variant="subtitle2"
                sx={{
                  color: inputTextColor ?? '$textSecondary',
                  marginTop: -4
                }}>
                {formatInCurrency(amount)}
              </Text>
            </View>
          </TouchableOpacity>
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
                  disabled={disabled}
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
      {/* <Text
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
      </Text> */}
    </View>
  )
}

type PercentageButton = {
  text: string
  percent: number
  value?: bigint
  isSelected: boolean
}
