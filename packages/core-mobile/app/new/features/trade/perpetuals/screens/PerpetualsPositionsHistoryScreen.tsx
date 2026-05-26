import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import React, { useCallback } from 'react'
import { ListRenderItem } from 'react-native'
import { PositionListItem } from '../components/PositionListItem'
import { POSITIONS_HISTORY_MOCK } from '../mocks'
import { PositionEntry } from '../types'

export const PerpetualsPositionsHistoryScreen = (): JSX.Element => {
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
      data={POSITIONS_HISTORY_MOCK}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderEmpty={renderEmpty}
    />
  )
}
