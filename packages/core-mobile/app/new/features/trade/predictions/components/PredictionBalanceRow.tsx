import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'

export const PredictionBalanceRow = ({
  onDepositPress
}: {
  onDepositPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        height: 60,
        borderRadius: 18,
        backgroundColor: theme.colors.$surfaceSecondary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10
      }}>
      {/* Token icon placeholder */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.15)',
          backgroundColor: theme.colors.$surfaceSecondary
        }}
      />

      {/* Balance info */}
      <View style={{ flex: 1, paddingLeft: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="heading5">$0.00</Text>
          <Icons.Navigation.ChevronRight
            color={theme.colors.$textPrimary}
            width={8}
            height={8}
          />
        </View>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          Available balance
        </Text>
      </View>

      {/* Deposit button */}
      <Button type="primary" size="small" onPress={onDepositPress}>
        Deposit funds
      </Button>
    </View>
  )
}
