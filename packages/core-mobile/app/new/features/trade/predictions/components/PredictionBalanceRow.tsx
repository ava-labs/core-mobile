import {
  alpha,
  AnimatedPressable,
  BlurViewWithFallback,
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
import { Platform } from 'react-native'

const PAIRED_BUTTON_OUTER_RADIUS = 20
const PAIRED_BUTTON_INNER_RADIUS = 4

export const PredictionBalanceRow = ({
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

  const hasFunds = balance !== undefined && balance > 0
  const formattedBalance = formatCurrency({
    amount: balance ?? 0,
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

  return (
    <AnimatedPressable
      onPress={handleOnBalancePress}
      disabled={onBalancePress === undefined}
      style={{
        borderRadius: 18,
        overflow: 'hidden'
      }}>
      <BlurViewWithFallback
        backgroundColor={
          Platform.OS === 'ios'
            ? theme.isDark
              ? alpha(theme.colors.$textPrimary, 0.25)
              : alpha(theme.colors.$textPrimary, 0)
            : theme.colors.$surfaceSecondary
        }
        style={{
          height: 60,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          gap: 10
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

        {hasFunds ? (
          <View style={{ flexDirection: 'row', gap: 3 }}>
            <Button
              type="secondary"
              size="small"
              onPress={handleOnWithdrawPress}
              style={{
                borderTopLeftRadius: PAIRED_BUTTON_OUTER_RADIUS,
                borderBottomLeftRadius: PAIRED_BUTTON_OUTER_RADIUS,
                borderTopRightRadius: PAIRED_BUTTON_INNER_RADIUS,
                borderBottomRightRadius: PAIRED_BUTTON_INNER_RADIUS
              }}>
              Withdraw
            </Button>
            <Button
              type="secondary"
              size="small"
              onPress={handleOnTopUpPress}
              style={{
                borderTopLeftRadius: PAIRED_BUTTON_INNER_RADIUS,
                borderBottomLeftRadius: PAIRED_BUTTON_INNER_RADIUS,
                borderTopRightRadius: PAIRED_BUTTON_OUTER_RADIUS,
                borderBottomRightRadius: PAIRED_BUTTON_OUTER_RADIUS
              }}>
              Top up
            </Button>
          </View>
        ) : (
          <Button type="primary" size="small" onPress={handleOnDepositPress}>
            Deposit funds
          </Button>
        )}
      </BlurViewWithFallback>
    </AnimatedPressable>
  )
}
