import React from 'react'
import { LayoutChangeEvent } from 'react-native'
import {
  PriceChange,
  PriceChangeIndicator,
  Text,
  View
} from '@avalabs/k2-alpine'
import { MarketToken } from 'store/watchlist'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { TokenLogo } from 'features/portfolio/assets/components/TokenLogo'

export const TokenHeader = ({
  token,
  priceChange,
  onLayout
}: {
  token: MarketToken
  priceChange?: PriceChange
  onLayout?: (event: LayoutChangeEvent) => void
}): React.JSX.Element => {
  const {
    appHook: { tokenInCurrencyFormatter }
  } = useApplicationContext()

  const renderBalance = (): React.JSX.Element => {
    return (
      <View
        style={{
          flexDirection: 'column',
          gap: 5
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text variant="heading2">
            {tokenInCurrencyFormatter(token.currentPrice ?? 0)}
          </Text>
        </View>
        <View sx={{ opacity: priceChange ? 1 : 0 }}>
          <PriceChangeIndicator
            formattedPrice={priceChange?.formattedPrice ?? '$0.00'}
            status={priceChange?.status ?? 'equal'}
            formattedPercent={priceChange?.formattedPercent ?? '0.00%'}
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
