import {
  alpha,
  Icons,
  PriceChangeIndicator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { useCallback } from 'react'
import Animated from 'react-native-reanimated'
import { useLiveMid } from '../hooks/usePerpsLiveMids'
import { usePriceFlash } from '../hooks/usePriceFlash'
import { PerpMarketView } from '../types'
import { dexOfCoin, tickerOfCoin } from '../utils/coinDex'
import { DexBadge } from './DexBadge'
import { PerpsBadge } from './PerpsBadge'
import { PerpsCoinLogo } from './PerpsCoinLogo'

const PerpetualListItemComponent = ({
  market,
  isFirst,
  onPress
}: {
  market: PerpMarketView
  isFirst: boolean
  onPress?: (symbol: string) => void
}): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  // Prefer the live WS mid (fed by `usePerpsLiveMidsFeed` on the list screen),
  // falling back to the REST snapshot price until the first tick arrives. The
  // per-coin subscription means a tick only re-renders this row.
  const liveMid = useLiveMid(market.symbol)
  const price = liveMid ?? market.price
  const flashStyle = usePriceFlash(price)

  const formattedVolume = formatCurrency({
    amount: market.volume,
    notation: 'compact'
  })
  const formattedPrice = formatCurrency({ amount: price })
  const formattedPercent = `${market.changePercent.toFixed(2)}%`
  const handlePress = useCallback(() => {
    onPress?.(market.symbol)
  }, [market.symbol, onPress])

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
      }}>
      <PerpsCoinLogo size={36} symbol={market.symbol} />
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
              <Text variant="buttonMedium">{`${market.rank}. ${tickerOfCoin(
                market.symbol
              )}`}</Text>
              <DexBadge dex={dexOfCoin(market.symbol)} />
              {market.tags?.map(tag => (
                <PerpsBadge key={tag}>{tag}</PerpsBadge>
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
            <Animated.View
              style={[{ borderRadius: 4, paddingHorizontal: 3 }, flashStyle]}>
              <Text variant="buttonMedium">{formattedPrice}</Text>
            </Animated.View>
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

/**
 * Memoized so a live-mid tick (which only notifies the subscribed row via
 * `useLiveMid`) doesn't cascade into re-rendering every other row when the
 * parent list re-renders with the same item props.
 */
export const PerpetualListItem = React.memo(PerpetualListItemComponent)
