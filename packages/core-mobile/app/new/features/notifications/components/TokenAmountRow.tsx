import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import React from 'react'

const TOKEN_LOGO_SIZE = 40
const NETWORK_LOGO_SIZE = 16
const BORDER_WIDTH = 2
const NETWORK_LOGO_OFFSET = -6

type TokenAmountRowProps = {
  symbol: string
  logoUri?: string
  networkLogoUri?: string
  amount?: string
  amountUsd?: string
  isDebit: boolean
}

export const TokenAmountRow = ({
  symbol,
  logoUri,
  networkLogoUri,
  amount,
  amountUsd,
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
      <View sx={{ width: TOKEN_LOGO_SIZE }}>
        <TokenLogo symbol={symbol} logoUri={logoUri} size={TOKEN_LOGO_SIZE} />
        {networkLogoUri && (
          <View
            sx={{
              width: NETWORK_LOGO_SIZE + BORDER_WIDTH * 2,
              height: NETWORK_LOGO_SIZE + BORDER_WIDTH * 2,
              borderRadius: 20 / 2,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: BORDER_WIDTH,
              borderColor: colors.$surfaceSecondary,
              position: 'absolute',
              bottom: NETWORK_LOGO_OFFSET,
              right: NETWORK_LOGO_OFFSET,
              backgroundColor: 'transparent'
            }}>
            <TokenLogo
              size={NETWORK_LOGO_SIZE}
              symbol=""
              logoUri={networkLogoUri}
              isNetworkToken
            />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="buttonMedium" sx={{ color: '$textSecondary' }}>
          {symbol}
        </Text>
      </View>
      {amount !== undefined && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            variant="heading4"
            sx={{
              color: isDebit ? colors.$textDanger : colors.$textPrimary
            }}>
            {isDebit ? `-${amount}` : amount}
          </Text>
          {amountUsd !== undefined && (
            <Text
              variant="body2"
              sx={{
                color: isDebit ? colors.$textDanger : colors.$textSecondary
              }}>
              {isDebit ? `-$${amountUsd}USD` : `$${amountUsd}USD`}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
