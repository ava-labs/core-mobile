import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import React from 'react'

const TOKEN_LOGO_SIZE = 40

type TokenAmountRowProps = {
  symbol: string
  logoUri?: string
  networkLogoUri?: string
  amount?: string
  amountInCurrency?: string
  isDebit: boolean
}

export const TokenAmountRow = ({
  symbol,
  logoUri,
  amount,
  amountInCurrency,
  isDebit
}: TokenAmountRowProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4
      }}>
      <TokenLogo symbol={symbol} logoUri={logoUri} size={TOKEN_LOGO_SIZE} />
      <View style={{ flex: 1 }}>
        <Text variant="buttonMedium" sx={{ color: '$textPrimary' }}>
          {symbol}
        </Text>
      </View>
      {amount !== undefined && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            variant="heading2"
            sx={{
              fontWeight: '500',
              color: isDebit ? colors.$textDanger : colors.$textPrimary
            }}>
            {isDebit ? `-${amount}` : amount}
          </Text>
          {amountInCurrency !== undefined && (
            <Text
              variant="body2"
              sx={{
                color: isDebit ? colors.$textDanger : colors.$textSecondary
              }}>
              {amountInCurrency}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
