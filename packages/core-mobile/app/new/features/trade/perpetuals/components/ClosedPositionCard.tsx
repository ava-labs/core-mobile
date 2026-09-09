import {
  alpha,
  PriceChangeStatus,
  StatusArrow,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { formatRelativeDateTime } from 'common/utils/formatRelativeDateTime'
import React from 'react'
import { PositionEntry } from '../types'
import { dexOfCoin, tickerOfCoin } from '../utils/coinDex'
import { DexBadge } from './DexBadge'
import { PerpsCoinLogo } from './PerpsCoinLogo'

/**
 * A closed position rendered in the same card style as the active
 * {@link PositionCard} — identical header (logo, ticker, side, exit price,
 * realized P&L) — but non-interactive: no expand chevron and, in place of the
 * TP/SL row, the time the position was closed.
 */
export const ClosedPositionCard = ({
  entry
}: {
  entry: PositionEntry
}): JSX.Element => {
  const { theme } = useTheme()
  const { formatCurrency } = useFormatCurrency()

  const sideLabel = entry.side === 'long' ? 'Long' : 'Short'
  const formattedPrice = formatCurrency({ amount: entry.avgPrice })
  const pnlSign = entry.pnl !== undefined && entry.pnl >= 0 ? '+' : ''
  const formattedPnl =
    entry.pnl !== undefined
      ? `${pnlSign}${formatCurrency({ amount: entry.pnl })}`
      : '—'
  const pnlColor =
    entry.pnlStatus === PriceChangeStatus.Up
      ? theme.colors.$textSuccess
      : entry.pnlStatus === PriceChangeStatus.Down
      ? theme.colors.$textDanger
      : theme.colors.$textPrimary

  return (
    <View
      style={{
        borderRadius: 18,
        backgroundColor: theme.colors.$surfaceSecondary,
        overflow: 'hidden'
      }}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingTop: 14
        }}>
        <PerpsCoinLogo size={36} symbol={entry.coin} />
        <View sx={{ marginLeft: 10, flex: 1 }}>
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Text variant="body2" sx={{ fontFamily: 'Inter-Medium' }}>
              {tickerOfCoin(entry.coin)}
            </Text>
            <DexBadge dex={dexOfCoin(entry.coin)} />
            <StatusArrow
              status={
                entry.side === 'long'
                  ? PriceChangeStatus.Up
                  : PriceChangeStatus.Down
              }
              size={10}
            />
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
              Closed
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
      </View>

      <View
        sx={{
          paddingBottom: 14,
          paddingTop: 8,
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'center',
          borderTopWidth: 1,
          borderColor: theme.colors.$borderPrimary,
          marginHorizontal: 12,
          gap: 6
        }}>
        <Text
          variant="caption"
          sx={{
            color: theme.colors.$textSecondary,
            fontFamily: 'Inter-Medium'
          }}>
          Closed
        </Text>
        <Text variant="caption" sx={{ fontFamily: 'Inter-Medium' }}>
          {formatRelativeDateTime(entry.timestamp, ' · ')}
        </Text>
      </View>
    </View>
  )
}
