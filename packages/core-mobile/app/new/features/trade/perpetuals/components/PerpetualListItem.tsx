import {
  alpha,
  Icons,
  PriceChangeIndicator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import { PerpetualMarket } from '../types'

export const PerpetualListItem = ({
  market,
  isFirst,
  onPress
}: {
  market: PerpetualMarket
  isFirst: boolean
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const formattedVolume = formatCurrency({
    amount: market.volume,
    notation: 'compact'
  })
  const formattedPrice = formatCurrency({ amount: market.price })
  const formattedPercent = `${market.changePercent.toFixed(2)}%`

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
      }}>
      <TokenLogo size={36} symbol={market.symbol} />
      <View
        sx={{
          borderTopWidth: isFirst ? 0 : 1,
          borderColor: alpha(theme.colors.$textPrimary, 0.1),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
          paddingVertical: 12
        }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <View>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="buttonMedium">{`${market.rank}. ${market.symbol}`}</Text>
              {market.tags?.map(tag => (
                <View
                  key={tag}
                  sx={{
                    backgroundColor: alpha(theme.colors.$textPrimary, 0.1),
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    height: 18,
                    justifyContent: 'center'
                  }}>
                  <Text variant="caption" sx={{ fontFamily: 'Inter-Medium' }}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
            <Text
              variant="body1"
              sx={{
                color: alpha(theme.colors.$textPrimary, 0.6),
                fontFamily: 'Inter-Medium',
                fontSize: 14
              }}>
              {`${formattedVolume} Volume`}
            </Text>
          </View>
        </View>

        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginRight: -6
          }}>
          <View
            sx={{
              alignItems: 'flex-end'
            }}>
            <Text variant="buttonMedium">{formattedPrice}</Text>
            <PriceChangeIndicator
              status={market.changeStatus}
              formattedPercent={formattedPercent}
              textVariant="body1"
              priceSx={{ fontSize: 14 }}
              percentSx={{ fontSize: 14 }}
            />
          </View>
          <Icons.Navigation.ChevronRight
            width={20}
            height={20}
            color={alpha(theme.colors.$textPrimary, 0.4)}
          />
        </View>
      </View>
    </TouchableOpacity>
  )
}
