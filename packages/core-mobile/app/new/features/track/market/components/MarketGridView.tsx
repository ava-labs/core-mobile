import React from 'react'
import {
  alpha,
  AnimatedPressable,
  Icons,
  PriceChangeIndicator,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { MarketToken } from 'store/watchlist'
import { TokenLogo } from 'features/portfolio/assets/components/TokenLogo'
import { ChartData } from 'services/token/types'
import MiniSparklineChart from 'features/track/components/MiniSparklineChart'

const SCREEN_WIDTH = Dimensions.get('window').width
const CHART_WIDTH = ((SCREEN_WIDTH - 46) / 2) * 0.6

const MarketGridView = ({
  token,
  chartData,
  index,
  onPress,
  formattedPrice,
  formattedPercentChange,
  formattedPriceChange,
  status,
  isFavorite
}: {
  token: MarketToken
  chartData: ChartData
  index: number
  onPress: () => void
  formattedPrice: string
  formattedPriceChange: string
  formattedPercentChange: string
  status: 'up' | 'down' | 'equal'
  isFavorite?: boolean
}): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)
  const { dataPoints, ranges } = chartData

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(index)}
      layout={LinearTransition.springify()}>
      <AnimatedPressable onPress={onPress}>
        <View
          sx={{
            borderRadius: 18,
            backgroundColor: '$surfaceSecondary',
            width: (SCREEN_WIDTH - 16 * 3) / 2,
            padding: 16
          }}>
          <TokenLogo
            size={36}
            symbol={token.symbol}
            logoUri={token.logoUri}
            backgroundColor={colors.$borderPrimary}
            borderColor={borderColor}
          />
          <View sx={{ marginTop: 8 }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {token.name}
            </Text>
            <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                variant="body2"
                sx={{ color: '$textSecondary', lineHeight: 18 }}
                numberOfLines={1}>
                {token.symbol.toUpperCase()}
              </Text>
              {isFavorite && <Icons.Toggle.StarFilled width={12} height={12} />}
            </View>
          </View>
          <View sx={{ marginTop: 16 }}>
            <MiniSparklineChart
              width={CHART_WIDTH}
              height={30}
              data={dataPoints}
              negative={ranges.diffValue < 0}
            />
          </View>
          <View
            sx={{
              marginTop: 16,
              justifyContent: 'flex-start',
              alignItems: 'flex-start'
            }}>
            <Text variant="buttonMedium" numberOfLines={1}>
              {formattedPrice}
            </Text>
            <PriceChangeIndicator
              formattedPrice={formattedPriceChange}
              formattedPercent={formattedPercentChange}
              status={status}
            />
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  )
}

export default MarketGridView
