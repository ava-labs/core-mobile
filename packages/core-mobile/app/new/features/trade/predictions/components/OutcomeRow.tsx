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
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'

export const OutcomeRow = ({
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
  const { theme } = useTheme()
  const volumeStr = `$${(volume / 1000).toFixed(2)}k`
  const trendStr = `${trendPct.toFixed(2)}%`
  const pctStr = `${Math.round(probability * 100)}%`

  return (
    <AnimatedPressable>
      <LinearGradient
        colors={['#28282E', '#28282E', 'rgba(40,40,46,0.9)']}
        locations={[0, probability, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height: 60,
          borderRadius: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 10,
          overflow: 'hidden'
        }}>
        <View style={{ flex: 1, flexDirection: 'column', paddingLeft: 10 }}>
          <Text
            variant="heading6"
            style={{ color: 'white', lineHeight: 21 }}
            numberOfLines={1}>
            {label}
          </Text>
          <PriceChangeIndicator
            status={trendUp ? PriceChangeStatus.Up : PriceChangeStatus.Down}
            formattedPercent={trendStr}
            formattedPrice={volumeStr}
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
      </LinearGradient>
    </AnimatedPressable>
  )
}
