import { ErrorState } from 'common/components/ErrorState'
import { ListScreenV2 } from 'common/components/ListScreenV2'
import React, { useCallback, useEffect } from 'react'
import { ListRenderItem } from '@shopify/flash-list'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { PositionListItem } from '../components/PositionListItem'
import { POSITIONS_HISTORY_MOCK } from '../mocks'
import { PositionEntry } from '../types'

export const PerpetualsPositionsHistoryScreen = (): JSX.Element => {
  useEffect(() => {
    AnalyticsService.capture('PerpetualsPositionsHistoryViewed')
  }, [])

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
    <ListScreenV2
      title="History"
      isModal
      data={POSITIONS_HISTORY_MOCK}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderEmpty={renderEmpty}
    />
  )
}
