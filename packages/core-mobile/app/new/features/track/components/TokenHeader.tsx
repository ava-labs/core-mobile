import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import {
  PriceChange,
  PriceChangeIndicator,
  Text,
  View
} from '@avalabs/k2-alpine'
import { MarketToken } from 'store/watchlist'
import { TokenLogo } from 'features/portfolio/assets/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'

export const TokenHeader = ({
  token,
  priceChange,
  onLayout
}: {
  token: MarketToken
  priceChange?: PriceChange
  onLayout?: (event: LayoutChangeEvent) => void
}): React.JSX.Element => {
  const { formatTokenInCurrency } = useFormatCurrency()

  const renderBalance = (): React.JSX.Element => {
    return (
      <View
        style={{
          flexDirection: 'column',
          gap: 5
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text variant="heading2">
            {formatTokenInCurrency(token.currentPrice ?? 0)}
          </Text>
        </View>
        <View sx={{ opacity: priceChange ? 1 : 0 }}>
          <PriceChangeIndicator
            formattedPrice={priceChange?.formattedPrice ?? UNKNOWN_AMOUNT}
            status={priceChange?.status ?? 'equal'}
            formattedPercent={priceChange?.formattedPercent ?? UNKNOWN_AMOUNT}
            textVariant="buttonMedium"
          />
        </View>
      </View>
    )
  }

  return (
    <View onLayout={onLayout}>
      <TokenLogo symbol={token.symbol} logoUri={token.logoUri} size={42} />
      <Text
        variant="heading2"
        sx={{ color: '$textSecondary', lineHeight: 38, marginTop: 15 }}
        numberOfLines={1}>
        {token.symbol.toUpperCase()}
      </Text>
      {renderBalance()}
    </View>
  )
}
