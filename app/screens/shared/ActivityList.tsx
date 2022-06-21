import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, RefreshControl, View } from 'react-native'
import AvaText from 'components/AvaText'
import Loader from 'components/Loader'
import {
  TransactionERC20,
  TransactionNormal
} from '@avalabs/wallet-react-components'
import { ScrollView } from 'react-native-gesture-handler'
import ActivityListItem from 'screens/activity/ActivityListItem'
import { endOfToday, endOfYesterday, format, isSameDay } from 'date-fns'
import { useBridgeSDK } from '@avalabs/bridge-sdk'
import BridgeTransactionItem from 'screens/bridge/components/BridgeTransactionItem'
import { BridgeTransactionStatusParams } from 'navigation/types'
import { Row } from 'components/Row'
import DropDown from 'components/Dropdown'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { isBridgeTransaction } from 'screens/bridge/utils/bridgeTransactionUtils'
import {
  isContractCallTransaction,
  isIncomingTransaction,
  isOutgoingTransaction
} from 'utils/TransactionTools'
import { selectActiveNetwork, TokenSymbol } from 'store/network'
import { useSelector } from 'react-redux'
import { selectBridgeTransactions } from 'store/bridge'

const yesterday = endOfYesterday()
const today = endOfToday()

enum ActivityFilter {
  All = 'All',
  ContractApprovals = 'Contract Approvals',
  Incoming = 'Incoming',
  Outgoing = 'Outgoing',
  Bridge = 'Bridge'
}

const filterOptions = [
  ActivityFilter.All,
  ActivityFilter.ContractApprovals,
  ActivityFilter.Incoming,
  ActivityFilter.Outgoing,
  ActivityFilter.Bridge
]

interface Props {
  embedded?: boolean
  tokenSymbolFilter?: string
  openTransactionDetails: (item: TransactionNormal | TransactionERC20) => void
  openTransactionStatus: (params: BridgeTransactionStatusParams) => void
}

function ActivityList({
  embedded,
  tokenSymbolFilter,
  openTransactionDetails,
  openTransactionStatus
}: Props) {
  const [loading, setLoading] = useState(true)
  const { openUrl } = useInAppBrowser()
  const [allHistory, setAllHistory] = useState<
    (TransactionNormal | TransactionERC20)[]
  >([])
  const { bitcoinAssets, ethereumWrappedAssets } = useBridgeSDK()
  const bridgeTransactions = useSelector(selectBridgeTransactions)
  const [filter, setFilter] = useState(ActivityFilter.All)
  const activeNetwork = useSelector(selectActiveNetwork)

  //bow to lint gods
  setLoading
  setAllHistory

  const isBridgeTx = useCallback(
    (tx: typeof allHistory[0]): tx is TransactionERC20 => {
      return isBridgeTransaction(tx, ethereumWrappedAssets, bitcoinAssets)
    },
    [bitcoinAssets, ethereumWrappedAssets]
  )

  const getDayString = (date: Date) => {
    const isToday = isSameDay(today, date)
    const isYesterday = isSameDay(yesterday, date)
    return isToday
      ? 'Today'
      : isYesterday
      ? 'Yesterday'
      : format(date, 'MMMM do')
  }

  const filteredHistory = useMemo(
    () =>
      allHistory
        ?.filter(tx => {
          switch (filter) {
            case ActivityFilter.ContractApprovals:
              return isContractCallTransaction(tx)
            case ActivityFilter.Incoming:
              return isIncomingTransaction(tx) && !isBridgeTx(tx)
            case ActivityFilter.Outgoing:
              return isOutgoingTransaction(tx)
            case ActivityFilter.All:
              return true
            case ActivityFilter.Bridge:
              return isBridgeTx(tx)
            default:
              return false
          }
        })
        .filter(tx => {
          return tokenSymbolFilter
            ? tokenSymbolFilter ===
                ('tokenSymbol' in tx ? tx.tokenSymbol : TokenSymbol.AVAX)
            : true
        }),
    [allHistory, tokenSymbolFilter, isBridgeTx, filter]
  )

  useEffect(() => {
    loadHistory().then()
  }, [activeNetwork])

  const loadHistory = async () => {
    //todo - make and use ActivityService
    // if (!wallet) {
    //   return []
    // }
    // setLoading(true)
    // setAllHistory((await getHistory(wallet, 50)) ?? []) //fixme: get history from glacier?
    // setLoading(false)
  }

  const renderItems = () => {
    return (
      <View style={{ flex: 1 }}>
        {bridgeTransactions && Object.values(bridgeTransactions).length > 0 && (
          <>
            <Animated.View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 16,
                marginRight: 8
              }}>
              <AvaText.ActivityTotal>Pending</AvaText.ActivityTotal>
            </Animated.View>
            {Object.values(bridgeTransactions).map((tx, i) => {
              return (
                <BridgeTransactionItem
                  key={tx.sourceTxHash + i}
                  item={tx}
                  onPress={() => {
                    openTransactionStatus({
                      blockchain: tx.sourceChain,
                      txHash: tx.sourceTxHash || '',
                      txTimestamp: tx.sourceStartedAt
                        ? Date.parse(tx.sourceStartedAt.toString()).toString()
                        : Date.now().toString()
                    })
                  }}
                />
              )
            })}
          </>
        )}
        {filteredHistory.map((tx, index) => {
          const isNewDay =
            index === 0 ||
            !isSameDay(tx.timestamp, filteredHistory[index - 1].timestamp)

          return (
            <>
              {isNewDay && (
                <Animated.View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: 16,
                    marginRight: 8
                  }}>
                  <AvaText.ActivityTotal>
                    {getDayString(tx.timestamp)}
                  </AvaText.ActivityTotal>
                </Animated.View>
              )}
              {isBridgeTx(tx) ? (
                <BridgeTransactionItem
                  item={tx}
                  onPress={() => openUrl(tx.explorerLink)}
                />
              ) : (
                <ActivityListItem
                  tx={tx}
                  onPress={() => openTransactionDetails(tx)}
                />
              )}
            </>
          )
        })}
      </View>
    )
  }

  function onRefresh() {
    loadHistory().then()
  }

  /**
   * if view is embedded, meaning it's used in the bottom sheet (currently), then we wrap it
   * with the appropriate scrollview.
   *
   * We also don't show the 'header'
   * @param children
   */
  const ScrollableComponent = ({ children }: { children: React.ReactNode }) => {
    const isEmpty = filteredHistory.length === 0

    return embedded ? (
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }>
        {children}
      </ScrollView>
    ) : (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={
          isEmpty
            ? { flex: 1, justifyContent: 'center', alignItems: 'center' }
            : {
                marginVertical: 4
              }
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }>
        {children}
      </ScrollView>
    )
  }

  const selectedFilter = filterOptions.findIndex(option => option === filter)

  return !allHistory ? (
    <Loader />
  ) : (
    <View style={{ flex: 1 }}>
      {embedded || (
        <AvaText.LargeTitleBold textStyle={{ marginHorizontal: 16 }}>
          Activity
        </AvaText.LargeTitleBold>
      )}
      <Row style={{ justifyContent: 'flex-end', paddingHorizontal: 16 }}>
        <DropDown
          alignment={'flex-end'}
          width={200}
          data={filterOptions}
          selectedIndex={selectedFilter}
          selectionRenderItem={selectedItem => (
            <SelectionRenderItem text={selectedItem} />
          )}
          onItemSelected={selectedItem => setFilter(selectedItem)}
          optionsRenderItem={item => {
            return <OptionsRenderItem text={item.item} />
          }}
        />
      </Row>
      <ScrollableComponent children={renderItems()} />
    </View>
  )
}

function SelectionRenderItem({ text }: { text: string }) {
  return <AvaText.ButtonSmall>Display: {text}</AvaText.ButtonSmall>
}

function OptionsRenderItem({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <AvaText.Body1>{text}</AvaText.Body1>
    </View>
  )
}

export default ActivityList
