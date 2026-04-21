import {
  alpha,
  AnimatedPressable,
  Icons,
  PriceChangeIndicator,
  PriceChangeStatus,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'

export const MarketOutcomeRow = ({
  label,
  probability,
  volume,
  trendUp,
  trendPct
}: {
  label: string
  probability: number
  volume: number
  trendUp: boolean
  trendPct: number
}): JSX.Element => {
  const { formatCurrency } = useFormatCurrency()
  const { theme } = useTheme()
  const formattedVolume = formatCurrency({
    amount: volume,
    notation: 'compact'
  })
  const formattedPercent = `${trendPct.toFixed(2)}%`
  const pctStr = `${Math.round(probability * 100)}%`

  return (
    <AnimatedPressable
      style={{
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        overflow: 'hidden',
        backgroundColor: alpha(theme.colors.$textPrimary, 0.9)
      }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: 0,
          backgroundColor: theme.colors.$textPrimary,
          width: `20%`
        }}
      />
      <View style={{ flex: 1, flexDirection: 'column', paddingLeft: 10 }}>
        <Text
          variant="heading6"
          style={{ color: 'white', lineHeight: 21 }}
          numberOfLines={1}>
          {label}
        </Text>
        <PriceChangeIndicator
          status={trendUp ? PriceChangeStatus.Up : PriceChangeStatus.Down}
          formattedPercent={formattedPercent}
          formattedPrice={formattedVolume}
          priceSx={{ color: alpha(theme.colors.$white, 0.6) }}
          percentSx={{ color: theme.colors.$white }}
          signIndicator=""
          animated
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10
        }}>
        <Text variant="heading2" style={{ color: 'white' }}>
          {pctStr}
        </Text>
        <Icons.Navigation.ChevronRight width={24} height={24} color="white" />
      </View>
    </AnimatedPressable>
  )
}
