import {
  alpha,
  ANIMATED,
  Button,
  GroupList,
  GroupListItem,
  Icons,
  Pressable,
  PriceChangeStatus,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { StatusArrow } from '@avalabs/k2-alpine/src/components/PriceChangeIndicator/PriceChangeIndicator'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { Position } from '../types'

const CARD_WIDTH = 280

interface PositionCardProps {
  position: Position
  onPress?: () => void
  style?: { width?: number; marginRight?: number }
  /** When true, the card stretches to fill its container instead of using the
   * fixed carousel size (280×90). */
  fullWidth?: boolean
  /** When true, the card shows an expand chevron and can be tapped to reveal
   * additional details + action buttons. */
  expandable?: boolean
  defaultExpanded?: boolean
  onMarketClose?: () => void
  onLimitClose?: () => void
  onManage?: () => void
}

export const PositionCard = ({
  position,
  onPress,
  style,
  fullWidth = false,
  expandable = false,
  defaultExpanded = false,
  onMarketClose,
  onLimitClose,
  onManage
}: PositionCardProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const progress = useSharedValue(defaultExpanded ? 1 : 0)

  const pnlColor =
    position.pnlStatus === PriceChangeStatus.Down
      ? theme.colors.$textDanger
      : position.pnlStatus === PriceChangeStatus.Up
      ? theme.colors.$textSuccess
      : theme.colors.$textPrimary

  const sideLabel = position.side === 'long' ? 'Long' : 'Short'
  const formattedPrice = formatCurrency({ amount: position.price })
  const formattedPnl = formatCurrency({ amount: position.pnl })
  const formattedTakeProfit =
    position.takeProfit === 0
      ? 'None'
      : formatCurrency({ amount: position.takeProfit })
  const formattedStopLoss =
    position.stopLoss === 0
      ? 'None'
      : formatCurrency({ amount: position.stopLoss })

  const handlePress = useCallback(() => {
    if (expandable) {
      setExpanded(prev => {
        const next = !prev
        progress.value = withTiming(next ? 1 : 0, { duration: 250 })
        return next
      })
    }
    onPress?.()
  }, [expandable, onPress, progress])

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }]
  }))

  const detailRows = useMemo<GroupListItem[]>(() => {
    const rows: GroupListItem[] = []
    if (
      position.liquidationPrice !== undefined &&
      position.liquidationDistance !== undefined
    ) {
      rows.push({
        title: 'Liquidation price',
        subtitle: `${position.liquidationDistance.toFixed(
          2
        )}% from current price`,
        value: formatCurrency({ amount: position.liquidationPrice })
      })
    }
    if (position.markPrice !== undefined) {
      rows.push({
        title: 'Mark price',
        value: formatCurrency({ amount: position.markPrice })
      })
    }
    if (position.entryPrice !== undefined) {
      rows.push({
        title: 'Entry price',
        value: formatCurrency({ amount: position.entryPrice })
      })
    }
    if (position.funding !== undefined) {
      rows.push({
        title: 'Funding',
        value: formatCurrency({ amount: position.funding })
      })
    }
    return rows
  }, [
    position.liquidationPrice,
    position.liquidationDistance,
    position.markPrice,
    position.entryPrice,
    position.funding,
    formatCurrency
  ])

  const expandedHeight = useSharedValue(0)

  const handleExpandedLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout
      expandedHeight.value = height
    },
    [expandedHeight]
  )

  const expandedStyle = useAnimatedStyle(() => ({
    height: withTiming(expanded ? expandedHeight.value : 0, {
      ...ANIMATED.TIMING_CONFIG,
      duration: 0
    })
  }))

  return (
    <Animated.View
      layout={LinearTransition.easing(Easing.inOut(Easing.ease))}
      style={[
        {
          width: fullWidth ? undefined : CARD_WIDTH,
          alignSelf: fullWidth ? 'stretch' : undefined,
          borderRadius: 18,
          backgroundColor: theme.colors.$surfaceSecondary,
          overflow: 'hidden'
        },
        style
      ]}>
      <Pressable onPress={handlePress}>
        <PositionHeader
          position={position}
          sideLabel={sideLabel}
          formattedPrice={formattedPrice}
          formattedPnl={formattedPnl}
          pnlColor={pnlColor}
          showChevron={expandable}
          chevronStyle={chevronStyle}
        />

        <View
          sx={{
            paddingBottom: 14,
            paddingTop: 8,
            marginTop: 14,
            flexDirection: 'row',
            borderTopWidth: 1,
            borderColor: theme.colors.$borderPrimary,
            marginHorizontal: 12,
            gap: 10
          }}>
          <ProtectionMetric label="Take Profit" value={formattedTakeProfit} />
          <ProtectionMetric label="Stop Loss" value={formattedStopLoss} />
        </View>
      </Pressable>

      {expandable ? (
        <Animated.View style={expandedStyle}>
          <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
            onLayout={handleExpandedLayout}>
            <View>
              <View
                sx={{ flexDirection: 'row', gap: 4, paddingHorizontal: 14 }}>
                <Button
                  type="secondary"
                  size="small"
                  onPress={onMarketClose}
                  style={{ flex: 1 }}>
                  Market close
                </Button>
                <Button
                  type="secondary"
                  size="small"
                  onPress={onLimitClose}
                  style={{ flex: 1 }}>
                  Limit close
                </Button>
                <Button
                  type="secondary"
                  size="small"
                  onPress={onManage}
                  style={{ flex: 1 }}>
                  Manage
                </Button>
              </View>
              {detailRows.length > 0 ? (
                <GroupList
                  data={detailRows}
                  titleSx={{ fontFamily: 'Inter-Regular' }}
                  subtitleVariant="subtitle2"
                />
              ) : null}
            </View>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  )
}

const PositionHeader = ({
  position,
  sideLabel,
  formattedPrice,
  formattedPnl,
  pnlColor,
  showChevron,
  chevronStyle
}: {
  position: Position
  sideLabel: string
  formattedPrice: string
  formattedPnl: string
  pnlColor: string
  showChevron: boolean
  chevronStyle: StyleProp<ViewStyle>
}): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 14
      }}>
      <TokenLogo size={36} symbol={position.symbol} />
      <View sx={{ marginLeft: 10, flex: 1 }}>
        <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text variant="body2" sx={{ fontFamily: 'Inter-Medium' }}>
            {position.symbol}
          </Text>
          <StatusArrow status={position.pnlStatus} size={10} />
          <Text variant="body2" sx={{ fontFamily: 'Inter-Medium' }}>
            {sideLabel}
          </Text>
        </View>
        <View
          sx={{
            marginTop: 2,
            alignSelf: 'flex-start',
            backgroundColor: alpha(theme.colors.$textPrimary, 0.1),
            borderRadius: 6,
            paddingHorizontal: 6,
            paddingVertical: 2
          }}>
          <Text variant="caption" sx={{ fontFamily: 'Inter-Medium' }}>
            {position.leverage}×
          </Text>
        </View>
      </View>
      <View sx={{ alignItems: 'flex-end' }}>
        <Text variant="body2" sx={{ fontFamily: 'Inter-Medium' }}>
          {formattedPrice}
        </Text>
        <Text
          variant="body2"
          sx={{ color: pnlColor, fontFamily: 'Inter-Medium' }}>
          {formattedPnl}
        </Text>
      </View>
      {showChevron ? (
        <Animated.View style={[{ marginLeft: 4 }, chevronStyle]}>
          <Icons.Navigation.ExpandMore
            width={24}
            height={24}
            color={alpha(theme.colors.$textPrimary, 0.3)}
          />
        </Animated.View>
      ) : null}
    </View>
  )
}

const ProtectionMetric = ({
  label,
  value
}: {
  label: string
  value: string
}): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Text
        variant="caption"
        sx={{
          color: theme.colors.$textSecondary,
          fontFamily: 'Inter-Medium'
        }}>
        {label}
      </Text>
      <Icons.Custom.TakeProfit
        width={8}
        height={8}
        color={theme.colors.$textPrimary}
      />
      <Text variant="caption" sx={{ fontFamily: 'Inter-Medium' }}>
        {value}
      </Text>
    </View>
  )
}
