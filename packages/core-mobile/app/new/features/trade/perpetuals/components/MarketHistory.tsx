import {
  alpha,
  GroupList,
  type GroupListItem,
  Icons,
  PriceChangeStatus,
  StatusArrow,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import React, { useMemo } from 'react'
import { usePerpsUserFills } from '../hooks/usePerpsUserFills'
import type { PositionEntry } from '../types'
import { toRecentCoinEntries } from '../utils/toPosition'

const MAX_ENTRIES = 5

interface MarketHistoryProps {
  coin: string
}

/**
 * "History" section for the market details screen: the user's most recent
 * fills on this market, newest first, capped at {@link MAX_ENTRIES}. Renders
 * nothing while loading or when the user has no fills for the coin.
 */
export const MarketHistory = ({
  coin
}: MarketHistoryProps): JSX.Element | null => {
  const { fills } = usePerpsUserFills()

  const entries = useMemo(
    () => toRecentCoinEntries(fills, coin, MAX_ENTRIES),
    [fills, coin]
  )

  if (entries.length === 0) {
    return null
  }

  return (
    <View sx={{ marginTop: 24, marginHorizontal: 16, gap: 10 }}>
      <Text variant="heading3">History</Text>
      <GroupList itemHeight={60} data={entries.map(toHistoryRow)} />
    </View>
  )
}

const toHistoryRow = (entry: PositionEntry): GroupListItem => ({
  leftIcon: <FillActionIcon outcome={entry.outcome} />,
  title: <FillTitle entry={entry} />,
  subtitle: <FillSubtitle entry={entry} />,
  value: <FillTimestamp entry={entry} />
})

// Closing fills subtract from the position, opening fills add to it.
const isClosingFill = (outcome: string): boolean =>
  outcome.toLowerCase().includes('close')

const FillActionIcon = ({ outcome }: { outcome: string }): JSX.Element => {
  const { theme } = useTheme()
  const Glyph = isClosingFill(outcome)
    ? Icons.Content.Remove
    : Icons.Content.Add

  return (
    <View
      sx={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: alpha(theme.colors.$textPrimary, 0.1)
      }}>
      <Glyph width={20} height={20} color={theme.colors.$textPrimary} />
    </View>
  )
}

const FillTitle = ({ entry }: { entry: PositionEntry }): JSX.Element => (
  <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <StatusArrow
      status={
        entry.side === 'long' ? PriceChangeStatus.Up : PriceChangeStatus.Down
      }
      size={10}
    />
    <Text
      variant="buttonMedium"
      sx={{
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        lineHeight: 22,
        color: '$textPrimary'
      }}>
      {entry.outcome}
    </Text>
  </View>
)

const FillSubtitle = ({ entry }: { entry: PositionEntry }): JSX.Element => {
  const { formatCurrency } = useFormatCurrency()

  return (
    <Text
      variant="body2"
      numberOfLines={1}
      sx={{ fontSize: 13, lineHeight: 16, color: '$textPrimary' }}>
      {`${formatCurrency({ amount: entry.size })} @ ${formatCurrency({
        amount: entry.avgPrice
      })}`}
    </Text>
  )
}

const FillTimestamp = ({ entry }: { entry: PositionEntry }): JSX.Element => {
  const { theme } = useTheme()

  return (
    <Text
      variant="body2"
      sx={{
        fontSize: 14,
        lineHeight: 18,
        textAlign: 'right',
        color: alpha(theme.colors.$textPrimary, 0.6)
      }}>
      {entry.dateLabel}
      {'\n'}
      {entry.timeLabel}
    </Text>
  )
}
