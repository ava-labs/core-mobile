import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabList } from 'common/components/CollapsibleTabList'
import { isXpTransaction } from 'common/utils/isXpTransactions'
import { PendingBridgeTransactionItem } from 'features/portfolio/assets/components/PendingBridgeTransactionItem'
import { TokenActivityListItem } from 'features/portfolio/assets/components/TokenActivityListItem'
import { XpActivityListItem } from 'features/portfolio/assets/components/XpActivityListItem'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import React, { useCallback } from 'react'
import { ViewStyle } from 'react-native'
import { ActivityListItem } from '../utils'

export const ActivityList = ({
  data,
  xpToken,
  containerStyle,
  isRefreshing,
  refresh,
  handlePendingBridge,
  handleExplorerLink,
  renderHeader,
  renderEmpty
}: {
  data: ActivityListItem[]
  containerStyle?: ViewStyle
  xpToken: TokenWithBalance | undefined
  isRefreshing: boolean
  handlePendingBridge: (transaction: BridgeTransaction | BridgeTransfer) => void
  handleExplorerLink: (explorerLink: string) => void
  refresh: () => void
  renderHeader: () => React.ReactNode
  renderEmpty: () => React.ReactNode
}): JSX.Element => {
  const { prices } = useWatchlist()

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
    <CollapsibleTabList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      containerStyle={containerStyle}
      renderEmpty={renderEmpty}
      renderHeader={renderHeader}
      isRefreshing={isRefreshing}
      onRefresh={refresh}
      extraData={{ prices }}
      listKey={xpToken?.symbol}
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
        paddingTop: isFirstItem ? 16 : 36,
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
