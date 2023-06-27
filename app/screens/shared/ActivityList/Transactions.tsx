import React, { useMemo } from 'react'
import { Animated, Dimensions, StyleSheet, View } from 'react-native'
import { ListRenderItemInfo as FlashListRenderItemInfo } from '@shopify/flash-list'
import AvaText from 'components/AvaText'
import ActivityListItem from 'screens/activity/ActivityListItem'
import {
  endOfToday,
  endOfYesterday,
  format,
  isSameDay,
  isSameYear
} from 'date-fns'
import BridgeTransactionItem from 'screens/bridge/components/BridgeTransactionItem'
import { BridgeTransactionStatusParams } from 'navigation/types'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { useSelector } from 'react-redux'
import { selectBridgeTransactions } from 'store/bridge'
import { Transaction } from 'store/transaction'
import ZeroState from 'components/ZeroState'
import { BridgeTransaction } from '@avalabs/bridge-sdk'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { RefreshControl } from 'components/RefreshControl'
import AvaList from 'components/AvaList'
import { usePostCapture } from 'hooks/usePosthogCapture'

const SCREEN_WIDTH = Dimensions.get('window').width
const BOTTOM_PADDING = SCREEN_WIDTH * 0.3

const yesterday = endOfYesterday()
const today = endOfToday()

const getDayString = (timestamp: number) => {
  // today
  if (isSameDay(today, timestamp)) return 'Today'

  // yesterday
  if (isSameDay(yesterday, timestamp)) return 'Yesterday'

  // if date is within this year, we show month + day
  if (isSameYear(today, timestamp)) return format(timestamp, 'MMMM do')

  // else we show month + day + year
  return format(timestamp, 'MMMM d, yyyy')
}

type Section = {
  title: string
  data: Transaction[] | BridgeTransaction[]
}

type Item = string | Transaction | BridgeTransaction

interface Props {
  isRefreshing: boolean
  onRefresh: () => void
  onEndReached?: () => void
  data: Transaction[]
  openTransactionDetails: (item: Transaction) => void
  openTransactionStatus: (params: BridgeTransactionStatusParams) => void
  hidePendingBridgeTransactions: boolean
  testID?: string
}

const Transactions = ({
  isRefreshing,
  onRefresh,
  onEndReached,
  data,
  openTransactionDetails,
  openTransactionStatus,
  hidePendingBridgeTransactions
}: Props) => {
  const { openUrl } = useInAppBrowser()
  const { capture } = usePostCapture()
  const bridgeDisabled = useIsUIDisabled(UI.Bridge)
  const pendingBridgeByTxId = useSelector(selectBridgeTransactions)
  const combinedData = useMemo(() => {
    const allSections: Section[] = []

    const pendingBridgeTransactions = Object.values(pendingBridgeByTxId).sort(
      (a, b) => b.sourceStartedAt - a.sourceStartedAt // descending
    )

    // add pending bridge transactions
    if (
      !hidePendingBridgeTransactions &&
      !bridgeDisabled &&
      pendingBridgeTransactions.length > 0
    )
      allSections.push({ title: 'Pending', data: pendingBridgeTransactions })

    // add all other transactions
    let section: { title: string; data: Transaction[] }
    let sectionTitle = ''

    data.forEach(item => {
      const dateText = getDayString(item.timestamp)
      if (!sectionTitle || sectionTitle !== dateText) {
        section = {
          title: dateText,
          data: [item]
        }
        sectionTitle = dateText
        allSections.push(section)
      } else {
        section.data.push(item)
      }
    })

    // convert back to flatlist data format
    const flatListData: Array<Item> = []

    for (const s of allSections) {
      flatListData.push(s.title)
      flatListData.push(...s.data)
    }

    return flatListData
  }, [bridgeDisabled, data, hidePendingBridgeTransactions, pendingBridgeByTxId])

  const renderPendingBridgeTransaction = (tx: BridgeTransaction) => {
    return (
      <BridgeTransactionItem
        key={tx.sourceTxHash}
        item={tx}
        onPress={() => {
          capture('ActivityCardPendingTransactionStatusShown')
          openTransactionStatus({
            txHash: tx.sourceTxHash || ''
          })
        }}
      />
    )
  }

  const flashRenderItem = ({ item }: FlashListRenderItemInfo<Item>) => {
    return renderListItem(item)
  }

  function renderListItem(item: Item) {
    // render section header
    if (typeof item === 'string') {
      return renderSectionHeader(item)
    }

    // render row
    if ('addressBTC' in item) {
      return renderPendingBridgeTransaction(item)
    } else {
      const onPress = () => {
        if (item.isContractCall || item.isBridge) {
          capture('ActivityCardLinkClickd')
          openUrl(item.explorerLink)
        } else {
          capture('ActivityCardDetailShown')
          openTransactionDetails(item)
        }
      }

      return (
        <View key={item.hash}>
          {item.isBridge ? (
            <BridgeTransactionItem item={item} onPress={onPress} />
          ) : (
            <ActivityListItem tx={item} onPress={onPress} />
          )}
        </View>
      )
    }
  }

  const renderSectionHeader = (title: string) => {
    return (
      <Animated.View style={styles.headerContainer}>
        <AvaText.ActivityTotal>{title}</AvaText.ActivityTotal>
      </Animated.View>
    )
  }

  const keyExtractor = (item: string | Transaction | BridgeTransaction) => {
    if (typeof item === 'string') return item

    if ('addressBTC' in item) return `pending-${item.sourceTxHash}`

    return item.hash
  }

  const renderTransactions = () => {
    return (
      <AvaList
        data={combinedData}
        flashRenderItem={flashRenderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.contentContainer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={TransactionsZeroState}
        refreshControl={
          <RefreshControl onRefresh={onRefresh} refreshing={isRefreshing} />
        }
        getItemType={(item: Item) => {
          return typeof item === 'string' ? 'sectionHeader' : 'row'
        }}
        estimatedItemSize={71}
      />
    )
  }

  return <View style={styles.container}>{renderTransactions()}</View>
}

const TransactionsZeroState = () => {
  return (
    <View style={styles.zeroState}>
      <ZeroState.NoTransactions />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: BOTTOM_PADDING },
  zeroState: { flex: 1, marginTop: '30%' },
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginRight: 8
  }
})

export default React.memo(Transactions)
