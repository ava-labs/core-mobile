import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { FlashListProps, ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { isXpTransaction } from 'common/utils/isXpTransactions'
import { ACTIVITY_LIST_ITEM_HEIGHT } from 'features/portfolio/assets/components/ActivityListItem'
import { PendingBridgeTransactionItem } from 'features/portfolio/assets/components/PendingBridgeTransactionItem'
import { TokenActivityListItem } from 'features/portfolio/assets/components/TokenActivityListItem'
import { XpActivityListItem } from 'features/portfolio/assets/components/XpActivityListItem'
import React, { useCallback } from 'react'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { ActivityListItem } from '../utils'

export const ActivityList = ({
  data,
  xpToken,
  overrideProps,
  isRefreshing,
  refresh,
  handlePendingBridge,
  handleExplorerLink,
  renderHeader,
  renderEmpty
}: {
  data: ActivityListItem[]
  overrideProps?: FlashListProps<ActivityListItem>['overrideProps']
  xpToken: TokenWithBalance | undefined
  isRefreshing: boolean
  handlePendingBridge: (transaction: BridgeTransaction | BridgeTransfer) => void
  handleExplorerLink: (explorerLink: string) => void
  refresh: () => void
  renderHeader: () => React.ReactNode
  renderEmpty: () => React.ReactNode
}): JSX.Element => {
  const renderItem: ListRenderItem<ActivityListItem> = useCallback(
    ({ item, index }) => {
      if (item.type === 'header') {
        return <SectionHeader title={item.title} index={index} />
      }

      if (item.type === 'pendingBridge') {
        return (
          <PendingBridgeTransactionItem
            item={item.transaction}
            showSeparator={index !== data.length - 1}
            onPress={() => handlePendingBridge(item.transaction)}
          />
        )
      }

      const transaction = item.transaction
      const isXpTx =
        isXpTransaction(transaction.txType) &&
        xpToken &&
        (isTokenWithBalanceAVM(xpToken) || isTokenWithBalancePVM(xpToken))

      const props = {
        tx: transaction,
        index,
        onPress: () => handleExplorerLink(transaction.explorerLink)
      }

      const nextItem = data[index + 1]
      const showSeparator =
        nextItem?.type !== 'header' && index !== data.length - 1

      if (isXpTx) {
        return (
          <XpActivityListItem
            {...props}
            index={index}
            showSeparator={showSeparator}
          />
        )
      }

      return (
        <TokenActivityListItem
          {...props}
          index={index}
          showSeparator={showSeparator}
        />
      )
    },
    [data, handleExplorerLink, handlePendingBridge, xpToken]
  )

  const keyExtractor = useCallback((item: ActivityListItem) => item.id, [])

  return (
    <CollapsibleTabs.FlashList
      key={xpToken?.symbol}
      overrideProps={overrideProps}
      data={data}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      keyExtractor={keyExtractor}
      estimatedItemSize={ACTIVITY_LIST_ITEM_HEIGHT}
      refreshing={isRefreshing}
      onRefresh={refresh}
    />
  )
}

const SectionHeader = ({
  title,
  index
}: {
  title: string
  index: number
}): JSX.Element => {
  const { theme } = useTheme()

  const isFirstItem = index === 0

  return (
    <View
      sx={{
        paddingHorizontal: 16,
        paddingTop: isFirstItem ? 12 : 36,
        paddingBottom: 4,
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <Text
        variant="heading3"
        sx={{
          color: theme.colors.$textPrimary
        }}>
        {title}
      </Text>
    </View>
  )
}
