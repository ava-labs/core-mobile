import React, { useMemo } from 'react'
import { LayoutChangeEvent } from 'react-native'
import {
  PriceChange,
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  View
} from '@avalabs/k2-alpine'
import Animated, { FadeIn } from 'react-native-reanimated'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { formatLargeCurrency } from 'utils/Utils'
import { isEffectivelyZero } from '../utils/utils'
import { RankView } from './RankView'

export const TokenHeader = ({
  currentPrice,
  logoUri,
  symbol,
  ranges,
  rank,
  onLayout
}: {
  logoUri?: string
  currentPrice?: number
  ranges?: {
    diffValue: number
    percentChange: number
  }
  symbol: string
  rank?: number
  onLayout?: (event: LayoutChangeEvent) => void
}): React.JSX.Element => {
  const { formatTokenInCurrency } = useFormatCurrency()

  const priceChange: PriceChange | undefined = useMemo(() => {
    if (ranges === undefined) {
      return undefined
    }

    const absPriceChange = Math.abs(ranges.diffValue)

    // for effectively zero price changes, return undefined
    // this is to avoid displaying "0.00" in the price change column
    const formattedPrice = isEffectivelyZero(absPriceChange)
      ? undefined
      : formatLargeCurrency(formatTokenInCurrency({ amount: absPriceChange }))

    return {
      formattedPrice,
      status:
        ranges.diffValue < 0
          ? PriceChangeStatus.Down
          : ranges.diffValue === 0
          ? PriceChangeStatus.Neutral
          : PriceChangeStatus.Up,
      formattedPercent: `${ranges.percentChange.toFixed(2).replace('-', '')}%`
    }
  }, [ranges, formatTokenInCurrency])

  return (
    <View onLayout={onLayout}>
      <TokenLogo symbol={symbol} logoUri={logoUri} size={42} />
      <View
        sx={{
          marginTop: 15,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <View>
          <Text
            variant="heading2"
            sx={{ color: '$textSecondary', lineHeight: 38 }}
            numberOfLines={1}>
            {symbol.toUpperCase()}
          </Text>
          <View
            style={{
              flexDirection: 'column'
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <Text variant="heading2">
                {currentPrice !== undefined
                  ? formatTokenInCurrency({ amount: currentPrice })
                  : UNKNOWN_AMOUNT}
              </Text>
            </View>
          </View>
        </View>
        {rank !== undefined && rank > 0 && rank < 100 && (
          <Animated.View entering={FadeIn}>
            <RankView rank={rank} sx={{ marginRight: 10 }} />
          </Animated.View>
        )}
      </View>
      <View sx={{ opacity: priceChange ? 1 : 0, marginTop: 5 }}>
        <PriceChangeIndicator
          formattedPrice={priceChange?.formattedPrice}
          status={priceChange?.status ?? PriceChangeStatus.Neutral}
          formattedPercent={priceChange?.formattedPercent}
          textVariant="buttonMedium"
          animated={true}
        />
      </View>
    </View>
  )
}
