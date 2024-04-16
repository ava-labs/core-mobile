import React, { FC, useMemo } from 'react'
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  FlatList,
  Platform
} from 'react-native'
import AvaText from 'components/AvaText'
import ActivityListItem from 'screens/activity/ActivityListItem'
import BridgeTransactionItem from 'screens/bridge/components/BridgeTransactionItem'
import { BridgeTransactionStatusParams } from 'navigation/types'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { Transaction } from 'store/transaction'
import ZeroState from 'components/ZeroState'
import { BridgeTransaction } from '@avalabs/bridge-sdk'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { RefreshControl } from 'components/RefreshControl'
import FlashList from 'components/FlashList'
import { getDayString } from 'utils/date/getDayString'
import { isPendingBridgeTransaction } from 'screens/bridge/utils/bridgeUtils'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { useNetworks } from 'hooks/networks/useNetworks'

const SCREEN_WIDTH = Dimensions.get('window').width
const BOTTOM_PADDING = SCREEN_WIDTH * 0.3

type Section = {
  title: string
  data: Transaction[] | Array<BridgeTransaction | BridgeTransfer>
}

type Item = string | Transaction | BridgeTransaction | BridgeTransfer

interface Props {
  isRefreshing: boolean
  onRefresh: () => void
  onEndReached?: () => void
  data: Transaction[]
  openTransactionDetails: (item: Transaction) => void
  openTransactionStatus: (params: BridgeTransactionStatusParams) => void
  testID?: string
}

const Transactions: FC<Props> = ({
  isRefreshing,
  onRefresh,
  onEndReached,
  data,
  openTransactionDetails,
  openTransactionStatus
}) => {
  const { openUrl } = useInAppBrowser()
  const { activeNetwork } = useNetworks()
  const bridgeDisabled = useIsUIDisabled(UI.Bridge)
  const pendingBridgeTxs = usePendingBridgeTransactions(activeNetwork)
  const combinedData = useMemo(() => {
    function isPendingBridge(tx: Transaction): boolean {
      return (
        tx.isBridge &&
        pendingBridgeTxs.some(
          bridge =>
            (bridge.sourceTxHash === tx.hash ||
              (!!bridge.targetTxHash && bridge.targetTxHash === tx.hash)) &&
            Boolean(bridge.completedAt) === false
        )
      )
    }

    const allSections: Section[] = []

    // add pending bridge transactions
    if (!bridgeDisabled && pendingBridgeTxs.length > 0)
      allSections.push({
        title: 'Pending',
        data: pendingBridgeTxs.sort(
          (a, b) => b.sourceStartedAt - a.sourceStartedAt // descending
        )
      })

    // add all other transactions
    let section: { title: string; data: Transaction[] }
    let sectionTitle = ''

    data
      .filter(tx => !isPendingBridge(tx))
      .forEach(item => {
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
  }, [bridgeDisabled, data, pendingBridgeTxs])

  const renderPendingBridgeTransaction = (
    tx: BridgeTransaction | BridgeTransfer
  ): JSX.Element => {
    return (
      <BridgeTransactionItem
        key={tx.sourceTxHash}
        item={tx}
        onPress={() => {
          openTransactionStatus({
            txHash: tx.sourceTxHash || ''
          })
        }}
      />
    )
  }

  const renderItem = (item: Item): JSX.Element => {
    // render section header
    if (typeof item === 'string') {
      return renderSectionHeader(item)
    }

    // render row
    if (isPendingBridgeTransaction(item)) {
      return renderPendingBridgeTransaction(item)
    } else {
      const onPress = (): void => {
        if (item.isContractCall || item.isBridge) {
          AnalyticsService.capture('ActivityCardLinkClicked')
          openUrl(item.explorerLink)
        } else {
          AnalyticsService.capture('ActivityCardDetailShown')
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

  const renderSectionHeader = (title: string): JSX.Element => {
    return (
      <Animated.View style={styles.headerContainer}>
        <AvaText.ActivityTotal>{title}</AvaText.ActivityTotal>
      </Animated.View>
    )
  }

  const keyExtractor = (
    item: string | Transaction | BridgeTransaction | BridgeTransfer
  ): string => {
    if (typeof item === 'string') return item

    if (isPendingBridgeTransaction(item)) return `pending-${item.sourceTxHash}`

    return item.hash
  }

  const renderTransactions = (): JSX.Element => {
    if (Platform.OS === 'ios') {
      return (
        <FlashList
          data={combinedData}
          renderItem={item => renderItem(item.item)}
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

    return (
      <FlatList
        data={combinedData}
        renderItem={item => renderItem(item.item)}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.contentContainer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={TransactionsZeroState}
        refreshControl={
          <RefreshControl onRefresh={onRefresh} refreshing={isRefreshing} />
        }
      />
    )
  }

  return <View style={styles.container}>{renderTransactions()}</View>
}

const TransactionsZeroState = (): JSX.Element => {
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
    padding: 16
  }
})

export default React.memo(Transactions)
