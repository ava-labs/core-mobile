import { View } from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { ErrorState } from 'common/components/ErrorState'
import React, { useCallback, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import { usePerpsPullToRefresh } from '../hooks/usePerpsPullToRefresh'
import { usePerpsUserFills } from '../hooks/usePerpsUserFills'
import { PositionEntry } from '../types'
import { toPositionEntries } from '../utils/toPosition'
import { PositionListItem } from './PositionListItem'

/**
 * The "Activity" tab of the My positions screen: every fill (opens, closes,
 * partials) together in one chronological list, newest first — mirroring
 * core-web's single activity feed. Same rows as the History modal.
 */
export const PerpsActivityList = ({
  containerStyle
}: {
  containerStyle?: ViewStyle
}): JSX.Element => {
  const { fills, refetch: refetchFills } = usePerpsUserFills()
  const { isRefreshing, onRefresh } = usePerpsPullToRefresh(refetchFills)

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
      <CollapsibleTabs.ContentWrapper>
        <ErrorState
          icon={undefined}
          title="No activity yet"
          description="Your trades will show up here"
        />
      </CollapsibleTabs.ContentWrapper>
    ),
    []
  )

  const renderHeader = useCallback(() => {
    return <View sx={{ height: 12 }} />
  }, [])

  return (
    <CollapsibleTabList
      data={entries}
      renderHeader={renderHeader}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      renderEmpty={renderEmpty}
      containerStyle={containerStyle}
      contentContainerStyle={containerStyle}
      isRefreshing={isRefreshing}
      onRefresh={onRefresh}
      listKey="perps-activity"
    />
  )
}
