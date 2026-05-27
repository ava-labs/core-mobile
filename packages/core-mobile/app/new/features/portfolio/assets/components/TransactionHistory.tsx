import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { ActivityList } from 'features/activity/components/ActivityList'
import React, { FC, useCallback } from 'react'
import { Platform, ViewStyle } from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import Animated from 'react-native-reanimated'
import { LocalTokenWithBalance } from 'store/balance'
import { TokenActivity } from '../hooks/useTokenActivity'

interface Props {
  token?: LocalTokenWithBalance
  containerStyle: ViewStyle
  extraOffset: number
  handleExplorerLink: (
    explorerLink: string,
    hash?: string,
    hashType?: 'account' | 'tx'
  ) => void
  /**
   * Activity data passed in by the parent (computed via `useTokenActivity`).
   * Lifted out of this component so the parent can share the same activity
   * state with sibling renderers — e.g. the non-XP `ScrollScreen` path on
   * `TokenDetailScreen` reuses the same filter/sort state.
   */
  activity: TokenActivity
}

const TransactionHistory: FC<Props> = ({
  token,
  handleExplorerLink,
  containerStyle,
  extraOffset,
  activity
}): React.JSX.Element => {
  const header = useHeaderMeasurements()
  const {
    combinedData,
    filter,
    sort,
    isRefreshing,
    refresh,
    renderEmptyState
  } = activity

  const renderEmpty = useCallback(() => {
    return (
      <CollapsibleTabs.ContentWrapper extraOffset={extraOffset}>
        {renderEmptyState()}
      </CollapsibleTabs.ContentWrapper>
    )
  }, [extraOffset, renderEmptyState])

  const renderHeader = useCallback(() => {
    return (
      <DropdownSelections
        filter={filter}
        sort={sort}
        sx={{ paddingHorizontal: 16, paddingTop: 10 }}
      />
    )
  }, [filter, sort])

  const overrideProps = {
    contentContainerStyle: {
      overflow: 'visible',
      paddingBottom: 16,
      paddingTop: Platform.OS === 'android' ? header.height : 0,
      ...containerStyle
    }
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      style={{
        flex: 1
      }}>
      <ActivityList
        data={combinedData}
        xpToken={token}
        handleExplorerLink={handleExplorerLink}
        overrideProps={overrideProps}
        containerStyle={containerStyle}
        renderHeader={renderHeader}
        renderEmpty={renderEmpty}
        isRefreshing={isRefreshing}
        refresh={refresh}
      />
    </Animated.View>
  )
}

export default TransactionHistory
