import {
  alpha,
  AnimatedPressable,
  Button,
  Icons,
  Text,
  usePreventParentPress,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import { usePerpsAvailability } from '../perpetuals/hooks/usePerpsAvailability'

export const TradeBalance = ({
  balance,
  onBalancePress,
  onDepositPress,
  onWithdrawPress,
  onTopUpPress
}: {
  balance?: number
  onBalancePress?: () => void
  onDepositPress?: () => void
  onWithdrawPress?: () => void
  onTopUpPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const { isGeoBlocked } = usePerpsAvailability()

  const hasFunds = balance !== undefined && balance > 0
  const formattedBalance =
    balance === undefined
      ? '—'
      : formatCurrency({
          amount: balance,
          notation: 'compact'
        })

  const { createParentPressHandler, createChildPressHandler } =
    usePreventParentPress()

  const handleOnBalancePress = createParentPressHandler(() => {
    onBalancePress?.()
  })

  const handleOnWithdrawPress = createChildPressHandler(() => {
    onWithdrawPress?.()
  })

  const handleOnTopUpPress = createChildPressHandler(() => {
    onTopUpPress?.()
  })

  const handleOnDepositPress = createChildPressHandler(() => {
    onDepositPress?.()
  })

  if (isGeoBlocked && !hasFunds) {
    return <></>
  }

  return (
    <AnimatedPressable
      onPress={handleOnBalancePress}
      disabled={onBalancePress === undefined}
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        gap: 10,
        backgroundColor: theme.colors.$surfaceSecondary
      }}>
      <TokenLogo size={36} symbol="USDC" />

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 0 }}>
          <Text variant="heading6">{formattedBalance}</Text>
          <Icons.Navigation.ChevronRight
            width={20}
            height={20}
            color={alpha(theme.colors.$textPrimary, 0.4)}
          />
        </View>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          Available balance
        </Text>
      </View>

      {!isGeoBlocked && balance !== undefined ? (
        hasFunds ? (
          <View style={{ flexDirection: 'row', gap: 3 }}>
            <Button
              type="secondary"
              size="small"
              onPress={handleOnWithdrawPress}
              style={{
                borderRadius: 20,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4
              }}>
              Withdraw
            </Button>
            <Button
              type="secondary"
              size="small"
              onPress={handleOnTopUpPress}
              style={{
                borderRadius: 20,
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4
              }}>
              Top up
            </Button>
          </View>
        ) : (
          <Button type="primary" size="small" onPress={handleOnDepositPress}>
            Deposit funds
          </Button>
        )
      ) : null}
    </AnimatedPressable>
  )
}
