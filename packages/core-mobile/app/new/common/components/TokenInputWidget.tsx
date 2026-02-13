import { formatTokenAmount } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  Button,
  Icons,
  SxProp,
  Text,
  TokenAmount,
  TouchableOpacity,
  TokenAmountInput,
  TokenAmountInputRef,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useCallback, useEffect, useRef, useState } from 'react'
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
  isLoadingAmount = false,
  autoFocus,
  valid = true
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
  isLoadingAmount?: boolean
  autoFocus?: boolean
  valid?: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false)
  const [percentageButtons, setPercentageButtons] = useState<
    PercentageButton[]
  >([])

  const tokenAmountInputRef = useRef<TokenAmountInputRef>(null)

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
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12
            }}>
            {token && network && (
              <LogoWithNetwork
                token={token}
                network={network}
                outerBorderColor={colors.$surfaceSecondary}
              />
            )}
            <View sx={{ flex: 1, justifyContent: 'space-between' }}>
              <View
                sx={{
                  flexDirection: 'row'
                }}>
                <TouchableOpacity
                  onPress={onSelectToken}
                  disabled={!isTokenSelectable || disabled}>
                  <View sx={{ gap: 1 }}>
                    {token && <Text variant="subtitle2">{title}</Text>}
                    <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        variant="heading6"
                        testID={`select_token_title__${title}`}>
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
                      justifyContent: 'center',
                      flex: 1,
                      minHeight: 50
                    }}
                    pointerEvents={token === undefined ? 'none' : 'auto'}>
                    <TokenAmountInput
                      ref={tokenAmountInputRef}
                      testID="token_amount_input_field"
                      accessibilityLabel="token_amount_input_field"
                      accessible={true}
                      autoFocus={autoFocus}
                      editable={editable}
                      denomination={token?.decimals ?? 0}
                      textAlign="right"
                      valid={valid}
                      value={amount}
                      onChange={handleAmountChange}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      placeholder="0.00"
                      style={{
                        marginBottom: 8,
                        width: '100%'
                      }}
                    />
                  </View>
                </TouchableOpacity>
              </View>
              <View
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 24,
                  justifyContent: 'space-between',
                  marginTop: -12
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
                    flexShrink: 1
                  }}>
                  {isLoadingAmount && (
                    <View>
                      <View style={{ position: 'absolute', right: 6, top: -8 }}>
                        <ActivityIndicator size="small" />
                      </View>
                    </View>
                  )}
                  <Text
                    variant="subtitle2"
                    numberOfLines={1}
                    sx={{
                      color: valid ? colors.$textSecondary : colors.$textDanger
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
                    tokenAmountInputRef.current?.blur()
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
