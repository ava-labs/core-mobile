import { View } from '@avalabs/k2-alpine'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { ActivityList } from 'features/activity/components/ActivityList'
import React, { FC, useCallback } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { LocalTokenWithBalance } from 'store/balance'
import { TokenActivity } from '../hooks/useTokenActivity'

type HandleExplorerLink = (
  explorerLink: string,
  hash?: string,
  hashType?: 'account' | 'tx'
) => void

interface Props {
  token?: LocalTokenWithBalance
  handleExplorerLink: HandleExplorerLink
  /**
   * Activity data passed in by the parent (computed via `useTokenActivity`).
   * Lifted out so sibling renderers can share the same filter/sort state.
   */
  activity: TokenActivity
  /**
   * `'collapsible'` (default): renders inside a `CollapsibleTabs.Container`
   * via the tab-view-aware list. Used by the XP layout.
   *
   * `'plain'`: renders a non-scrolling list suitable for nesting inside a
   * regular `ScrollView` (e.g. `ScrollScreen`). Used by the non-XP layout.
   */
  mode?: 'collapsible' | 'plain'
  // Collapsible-mode only:
  containerStyle?: ViewStyle
  extraOffset?: number
}

const TransactionHistory: FC<Props> = ({
  mode = 'collapsible',
  token,
  handleExplorerLink,
  containerStyle,
  extraOffset = 0,
  activity
}): React.JSX.Element => {
  const {
    combinedData,
    filter,
    sort,
    isRefreshing,
    refresh,
    renderEmptyState
  } = activity

  const renderListHeader = useCallback(
    () => (
      <DropdownSelections
        filter={filter}
        sort={sort}
        sx={{ paddingHorizontal: 16, paddingTop: 10 }}
      />
    ),
    [filter, sort]
  )

  const renderEmpty = useCallback(() => {
    if (mode === 'plain') {
      return (
        <View
          style={[
            {
              alignItems: 'center',
              justifyContent: 'center'
            },
            containerStyle
          ]}>
          {renderEmptyState()}
        </View>
      )
    }
    return (
      <CollapsibleTabs.ContentWrapper extraOffset={extraOffset}>
        {renderEmptyState()}
      </CollapsibleTabs.ContentWrapper>
    )
  }, [mode, extraOffset, renderEmptyState, containerStyle])

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      style={{ flex: 1 }}>
      <ActivityList
        mode={mode}
        data={combinedData}
        xpToken={token}
        handleExplorerLink={handleExplorerLink}
        containerStyle={containerStyle}
        renderHeader={renderListHeader}
        renderEmpty={renderEmpty}
        isRefreshing={isRefreshing}
        refresh={refresh}
      />
    </Animated.View>
  )
}

export default TransactionHistory
