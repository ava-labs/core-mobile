import {
  alpha,
  PriceChangeStatus,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { StatusArrow } from '@avalabs/k2-alpine/src/components/PriceChangeIndicator/PriceChangeIndicator'
import { TokenLogo } from 'common/components/TokenLogo'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React from 'react'
import { PositionEntry } from '../types'

interface PositionListItemProps {
  entry: PositionEntry
  isFirst?: boolean
}

export const PositionListItem = ({
  entry,
  isFirst
}: PositionListItemProps): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const formattedSize = formatCurrency({ amount: entry.size })
  const formattedAvgPrice = formatCurrency({ amount: entry.avgPrice })
  const pnlSign = entry.pnl !== undefined && entry.pnl >= 0 ? '+' : ''
  const formattedPnl =
    entry.pnl !== undefined
      ? `${pnlSign}${formatCurrency({ amount: entry.pnl })}`
      : undefined

  const isUp = entry.pnlStatus === PriceChangeStatus.Up
  const pillBg = alpha(
    isUp ? theme.colors.$textSuccess : theme.colors.$textDanger,
    0.1
  )
  const pillColor = isUp ? theme.colors.$textSuccess : theme.colors.$textDanger

  return (
    <View
      sx={{
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 15
      }}>
      <TokenLogo size={36} symbol={entry.symbol} />

      <View
        sx={{
          flex: 1,
          flexDirection: 'row',
          borderTopWidth: isFirst ? 0 : 1,
          borderColor: theme.colors.$borderPrimary,
          paddingVertical: 12,
          alignItems: 'center',
          gap: 24
        }}>
        <View
          sx={{
            flex: 1
          }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <StatusArrow
              status={
                entry.side === 'long'
                  ? PriceChangeStatus.Up
                  : PriceChangeStatus.Down
              }
              size={10}
            />
            <Text
              variant="body2"
              sx={{
                color: alpha(theme.colors.$textPrimary, 0.6),
                fontFamily: 'Inter-Medium'
              }}>
              {entry.outcome}
            </Text>
          </View>
          <Text variant="buttonMedium">
            {formattedSize}
            <Text
              sx={{ color: alpha(theme.colors.$textPrimary, 0.6) }}
              variant="buttonMedium">{` @ `}</Text>
            {formattedAvgPrice}
          </Text>
        </View>

        {formattedPnl !== undefined ? (
          <View
            sx={{
              backgroundColor: pillBg,
              borderRadius: 20,
              paddingLeft: 6,
              paddingRight: 10,
              paddingVertical: 3
            }}>
            <Text
              variant="body2"
              sx={{ color: pillColor, fontFamily: 'Inter-Medium' }}>
              {formattedPnl}
            </Text>
          </View>
        ) : null}
        <View sx={{ alignItems: 'flex-end', gap: 2 }}>
          <Text
            variant="body2"
            sx={{
              color: alpha(theme.colors.$textPrimary, 0.6),
              textAlign: 'right'
            }}>
            {entry.dateLabel}
            {'\n'}
            {entry.timeLabel}
          </Text>
        </View>
      </View>
    </View>
  )
}
