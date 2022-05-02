import React, { useEffect, useMemo, useState } from 'react'
import { Animated, RefreshControl, View } from 'react-native'
import AvaText from 'components/AvaText'
import Loader from 'components/Loader'
import {
  getHistory,
  TransactionERC20,
  TransactionNormal,
  useNetworkContext,
  useWalletContext
} from '@avalabs/wallet-react-components'
import moment from 'moment'
import { ScrollView } from 'react-native-gesture-handler'
import ActivityListItem from 'screens/activity/ActivityListItem'
import { BridgeTransaction, useBridgeContext } from 'contexts/BridgeContext'
import { useBridgeSDK } from '@avalabs/bridge-sdk'
import BridgeTransactionItem, {
  TransactionBridgeItem
} from 'screens/bridge/components/BridgeTransactionItem'
import { BridgeTransactionStatusParams } from 'navigation/types'
import {
  isBridge,
  isContractCall,
  isIncoming,
  isOutgoing
} from 'utils/TrxTools'
import { Row } from 'components/Row'
import DropDown from 'components/Dropdown'

const DISPLAY_FORMAT_CURRENT_YEAR = 'MMMM DD'
const DISPLAY_FORMAT_PAST_YEAR = 'MMMM DD, YYYY'

interface Props {
  embedded?: boolean
  tokenSymbolFilter?: string
  openTransactionDetails: (item: TransactionNormal | TransactionERC20) => void
  openTransactionStatus: (params: BridgeTransactionStatusParams) => void
}

export type TxType =
  | TransactionNormal
  | TransactionERC20
  | TransactionBridgeItem

const TODAY = moment()
const YESTERDAY = moment().subtract(1, 'days')
type SectionType = { [x: string]: TxType[] }

function ActivityList({
  embedded,
  tokenSymbolFilter,
  openTransactionDetails,
  openTransactionStatus
}: Props) {
  const [loading, setLoading] = useState(true)
  const wallet = useWalletContext()?.wallet
  const { network } = useNetworkContext()!
  const [allHistory, setAllHistory] =
    useState<(TransactionNormal | TransactionERC20)[]>()
  const { bridgeTransactions } = useBridgeContext()
  const { bridgeAssets } = useBridgeSDK()
  const [filter, setFilter] = useState(ActivityFilter.All)

  const sectionData = useMemo(() => {
    const newSectionData: SectionType = {}

    if (Object.values(bridgeTransactions).length > 0) {
      Object.values(bridgeTransactions).map(tx => {
        const pending = newSectionData.Pending
        newSectionData.Pending = pending
          ? [...newSectionData.Pending, tx]
          : [...[tx]]
      })
    }

    allHistory
      ?.filter((tx: TxType) => {
        switch (filter) {
          case ActivityFilter.ContractApprovals:
            return isContractCall(tx)
          case ActivityFilter.Incoming:
            return isIncoming(tx)
          case ActivityFilter.Outgoing:
            return isOutgoing(tx)
          case ActivityFilter.All:
            return true
          case ActivityFilter.Bridge:
            return isBridge(tx, bridgeAssets)
          default:
            return false
        }
      })
      .filter((tx: TxType) => {
        return tokenSymbolFilter
          ? tokenSymbolFilter ===
              ('tokenSymbol' in tx ? tx.tokenSymbol : 'AVAX')
          : true
      })
      .forEach((it: TxType) => {
        const date = moment(
          'createdAt' in it
            ? it.createdAt
            : 'timestamp' in it
            ? it.timestamp
            : Date()
        )

        if (TODAY.isSame(date, 'day')) {
          const today = newSectionData.Today
          newSectionData.Today = today
            ? [...newSectionData.Today, it]
            : [...[it]]
        } else if (YESTERDAY.isSame(date, 'day')) {
          const yesterday = newSectionData.Yesterday
          newSectionData.Yesterday = yesterday
            ? [...newSectionData.Yesterday, it]
            : [...[it]]
        } else {
          const isCurrentYear = TODAY.year() === date.year()
          const titleDate = date.format(
            isCurrentYear
              ? DISPLAY_FORMAT_CURRENT_YEAR
              : DISPLAY_FORMAT_PAST_YEAR
          )
          const otherDate = newSectionData[titleDate]
          newSectionData[titleDate] = otherDate
            ? [...newSectionData[titleDate], it]
            : [...[it]]
        }
      })
    return newSectionData
  }, [allHistory, bridgeTransactions, filter, tokenSymbolFilter])

  useEffect(() => {
    loadHistory().then()
  }, [wallet, network, bridgeTransactions])

  const loadHistory = async () => {
    if (!wallet) {
      return []
    }
    setLoading(true)
    // if (Object.values(bridgeTransactions).length > 0) {
    //   const txs = await getHistory(wallet, 50);
    //   const merged = [bridgeTransactions, ...txs];
    //   setAllHistory(merged);
    // } else {
    setAllHistory((await getHistory(wallet, 50)) ?? [])
    // }
    setLoading(false)
  }

  const renderItems = () => {
    const items = Object.entries(sectionData).map(key => {
      return (
        <View key={key[0]}>
          <Animated.View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 16,
              marginRight: 8
            }}>
            <AvaText.ActivityTotal>{key[0]}</AvaText.ActivityTotal>
          </Animated.View>
          {key[1].map((item: TxType, index) => {
            if (isBridge(item, bridgeAssets)) {
              const bridgeItem = item as BridgeTransaction
              return (
                <BridgeTransactionItem
                  key={`${bridgeItem.sourceTxHash}-${bridgeItem.targetTxHash}-${index}`}
                  item={bridgeItem}
                  onPress={() =>
                    openTransactionStatus({
                      blockchain: bridgeItem.sourceNetwork,
                      txHash: bridgeItem.sourceTxHash ?? '',
                      txTimestamp:
                        bridgeItem?.createdAt?.toString() ??
                        Date.now().toString()
                    })
                  }
                />
              )
            } else {
              const ercNormalItem = item as TransactionNormal | TransactionERC20
              return (
                <ActivityListItem
                  key={(ercNormalItem.transactionIndex ?? 1) + index}
                  tx={ercNormalItem}
                  onPress={() => openTransactionDetails(ercNormalItem)}
                />
              )
            }
          })}
        </View>
      )
    })

    if (items.length > 0) {
      return items
    }

    // if no items we return zero state
    return (
      // replace with zero states once we have them
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: 16
        }}>
        <AvaText.Heading3 textStyle={{ textAlign: 'center' }}>
          As transactions take place, they will show up here.
        </AvaText.Heading3>
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
    const isEmpty = Object.entries(sectionData).length === 0

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
          data={[
            ActivityFilter.All,
            ActivityFilter.ContractApprovals,
            ActivityFilter.Incoming,
            ActivityFilter.Outgoing,
            ActivityFilter.Bridge
          ]}
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

enum ActivityFilter {
  All = 'All',
  ContractApprovals = 'Contract Approvals',
  Incoming = 'Incoming',
  Outgoing = 'Outgoing',
  Bridge = 'Bridge'
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
