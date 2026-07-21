import { Text, View } from '@avalabs/k2-alpine'
import React, { useMemo } from 'react'
import { usePerpsUserFills } from '../hooks/usePerpsUserFills'
import { toRecentCoinEntries } from '../utils/toPosition'
import { PositionListItem } from './PositionListItem'

const MAX_ENTRIES = 5

interface MarketHistoryProps {
  coin: string
}

/**
 * "History" section for the market details screen: the user's most recent
 * fills on this market, newest first, capped at {@link MAX_ENTRIES}. Rows are
 * the same {@link PositionListItem} the full History screen renders. Renders
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
    <View sx={{ marginTop: 24, gap: 10 }}>
      <Text variant="heading3" sx={{ marginHorizontal: 16 }}>
        History
      </Text>
      <View>
        {entries.map((entry, index) => (
          <PositionListItem
            key={entry.id}
            entry={entry}
            isFirst={index === 0}
          />
        ))}
      </View>
    </View>
  )
}
