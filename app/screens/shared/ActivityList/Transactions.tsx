import React, { useMemo } from 'react'
import {
  Animated,
  View,
  SectionList,
  SectionListRenderItem,
  StyleSheet,
  SectionListData
} from 'react-native'
import AvaText from 'components/AvaText'
import ActivityListItem from 'screens/activity/ActivityListItem'
import { endOfToday, endOfYesterday, format, isSameDay } from 'date-fns'
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

const yesterday = endOfYesterday()
const today = endOfToday()

const getDayString = (timestamp: number) => {
  const isToday = isSameDay(today, timestamp)
  const isYesterday = isSameDay(yesterday, timestamp)
  return isToday
    ? 'Today'
    : isYesterday
    ? 'Yesterday'
    : format(timestamp, 'MMMM do')
}
type Section = {
  title: string
  data: Transaction[] | BridgeTransaction[]
}

type SectionHeader = (info: {
  section: SectionListData<Transaction | BridgeTransaction, Section>
}) => React.ReactElement

interface Props {
  isRefreshing: boolean
  onRefresh: () => void
  onEndReached?: () => void
  data: Transaction[]
  openTransactionDetails: (item: Transaction) => void
  openTransactionStatus: (params: BridgeTransactionStatusParams) => void
  hidePendingBridgeTransactions: boolean
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
  const bridgeDisabled = useIsUIDisabled(UI.Bridge)
  const pendingBridgeTransactions = Object.values(
    useSelector(selectBridgeTransactions)
  )
  const combinedData = useMemo(() => {
    const allSections: Section[] = []

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

    return allSections
  }, [bridgeDisabled, data, pendingBridgeTransactions])

  const renderPendingBridgeTransaction = (tx: BridgeTransaction) => {
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

  const renderTransaction: SectionListRenderItem<
    Transaction | BridgeTransaction,
    Section
  > = ({ item: tx }) => {
    if ('addressBTC' in tx) {
      return renderPendingBridgeTransaction(tx)
    } else {
      const onPress = () => {
        if (tx.isContractCall || tx.isBridge) {
          openUrl(tx.explorerLink)
        } else {
          openTransactionDetails(tx)
        }
      }

      return (
        <View key={tx.hash}>
          {tx.isBridge ? (
            <BridgeTransactionItem item={tx} onPress={onPress} />
          ) : (
            <ActivityListItem tx={tx} onPress={onPress} />
          )}
        </View>
      )
    }
  }

  const renderZeroState = () => {
    return (
      <View style={styles.zeroState}>
        <ZeroState.NoTransactions />
      </View>
    )
  }

  const renderSectionHeader: SectionHeader = ({ section: { title } }) => {
    return (
      <Animated.View style={styles.headerContainer}>
        <AvaText.ActivityTotal>{title}</AvaText.ActivityTotal>
      </Animated.View>
    )
  }
  const renderTransactions = () => {
    const keyExtractor = (item: Transaction | BridgeTransaction) => {
      if ('addressBTC' in item) return item.sourceTxHash
      return item.hash
    }

    return (
      <SectionList
        indicatorStyle="white"
        sections={combinedData}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderTransaction}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.contentContainer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderZeroState()}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl onRefresh={onRefresh} refreshing={isRefreshing} />
        }
      />
    )
  }

  return <View style={styles.container}>{renderTransactions()}</View>
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { marginVertical: 4, paddingBottom: '20%', flexGrow: 1 },
  zeroState: { flex: 1, marginTop: '-30%' },
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginRight: 8
  }
})

export default React.memo(Transactions)
