import React, { memo } from 'react'
import {
  alpha,
  AnimatedPressable,
  Icons,
  MiniChart,
  PriceChangeIndicator,
  PriceChangeStatus,
  SPRING_LINEAR_TRANSITION,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
import Animated from 'react-native-reanimated'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { MarketToken } from 'store/watchlist'
import { TokenLogo } from 'features/portfolio/assets/components/TokenLogo'
import { ChartData } from 'services/token/types'
import { GRID_GAP } from 'common/consts'

const SCREEN_WIDTH = Dimensions.get('window').width
const CHART_WIDTH = 90
const CHART_HEIGHT = 24

export const MarketGridView = memo(
  ({
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
    formattedPercentChange?: string
    status: PriceChangeStatus
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
        layout={SPRING_LINEAR_TRANSITION}>
        <AnimatedPressable onPress={onPress}>
          <View
            sx={{
              borderRadius: 18,
              backgroundColor: '$surfaceSecondary',
              width: (SCREEN_WIDTH - 16 * 2 - GRID_GAP) / 2,
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
                {isFavorite && (
                  <Icons.Toggle.StarFilled width={12} height={12} />
                )}
              </View>
            </View>
            <View sx={{ marginTop: 16 }}>
              <MiniChart
                style={{ width: CHART_WIDTH, height: CHART_HEIGHT }}
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.token.id === nextProps.token.id &&
      (prevProps.formattedPrice === nextProps.formattedPrice ||
        prevProps.formattedPriceChange === nextProps.formattedPriceChange ||
        prevProps.formattedPercentChange === nextProps.formattedPercentChange ||
        prevProps.status === nextProps.status)
    )
  }
)
