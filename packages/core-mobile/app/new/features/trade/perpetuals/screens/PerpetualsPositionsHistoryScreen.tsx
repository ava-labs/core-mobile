import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import React, { useCallback, useEffect, useMemo } from 'react'
import { ListRenderItem } from 'react-native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { PositionListItem } from '../components/PositionListItem'
import { usePerpsUserFills } from '../hooks/usePerpsUserFills'
import { toPositionEntries } from '../utils/toPosition'
import { PositionEntry } from '../types'

export const PerpetualsPositionsHistoryScreen = (): JSX.Element => {
  useEffect(() => {
    AnalyticsService.capture('PerpetualsPositionsHistoryViewed')
  }, [])

  const { fills } = usePerpsUserFills()
  const entries = useMemo(() => toPositionEntries(fills), [fills])

  const renderItem: ListRenderItem<PositionEntry> = useCallback(
    ({ item, index }) => (
      <PositionListItem entry={item} isFirst={index === 0} />
    ),
    []
  )

  const keyExtractor = useCallback((item: PositionEntry) => item.id, [])

  const renderEmpty = useCallback(
    () => (
      <ErrorState
        icon={undefined}
        title="No history yet"
        description="Closed positions will show up here"
      />
    ),
    []
  )

  return (
    <ListScreen
      title="History"
      isModal
      data={entries}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderEmpty={renderEmpty}
    />
  )
}
