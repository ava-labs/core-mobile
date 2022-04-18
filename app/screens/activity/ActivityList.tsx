// @ts-nocheck TODO CP-1728: Fix Typescript Errors - Activity Details/Transactions
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, RefreshControl, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
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
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from 'navigation/WalletScreenStack'
import { BridgeTransaction, useBridgeContext } from 'contexts/BridgeContext'
import { Blockchain, useBridgeSDK } from '@avalabs/bridge-sdk'
import BridgeTransactionItem from 'screens/bridge/components/BridgeTransactionItem'

const DISPLAY_FORMAT_CURRENT_YEAR = 'MMMM DD'
const DISPLAY_FORMAT_PAST_YEAR = 'MMMM DD, YYYY'

interface Props {
  embedded?: boolean
  tokenSymbolFilter?: string
}

export type TxType = TransactionNormal | TransactionERC20 | BridgeTransaction
const TODAY = moment()
const YESTERDAY = moment().subtract(1, 'days')
type SectionType = { [x: string]: TxType[] }

function ActivityList({ embedded, tokenSymbolFilter }: Props) {
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const wallet = useWalletContext()?.wallet
  const { network } = useNetworkContext()!
  const [allHistory, setAllHistory] =
    useState<(TransactionNormal | TransactionERC20)[]>()
  const { bridgeTransactions } = useBridgeContext()
  const { bridgeAssets } = useBridgeSDK()

  const isTransactionBridge = useCallback(
    tx => {
      if (bridgeAssets) {
        return (
          Object.values(bridgeAssets).filter(
            el =>
              (el.nativeNetwork === Blockchain.AVALANCHE &&
                el.nativeContractAddress?.toLowerCase() ===
                  tx.contractAddress?.toLowerCase()) ||
              el.wrappedContractAddress?.toLowerCase() ===
                tx.contractAddress?.toLowerCase() ||
              tx?.to === '0x0000000000000000000000000000000000000000' ||
              tx?.from === '0x0000000000000000000000000000000000000000'
          ).length > 0
        )
      }

      return false
    },
    [bridgeAssets]
  )

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
        return tokenSymbolFilter
          ? tokenSymbolFilter ===
              ('tokenSymbol' in tx ? tx.tokenSymbol : 'AVAX')
          : true
      })
      .forEach((it: TxType) => {
        const date = moment('timestamp' in it ? it.timestamp : '')
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
  }, [allHistory, tokenSymbolFilter])

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

  const openTransactionDetails = useCallback((item: TxType) => {
    return navigation.navigate(AppNavigation.Wallet.ActivityDetail, {
      tx: item
    })
  }, [])

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
            if ('requiredConfirmationCount' in item) {
              if (isTransactionBridge(item)) {
                return (
                  <BridgeTransactionItem
                    key={`${item.sourceTxHash}-${item.targetTxHash}-${index}`}
                    item={item}
                    onPress={() => openTransactionDetails(item)}
                  />
                )
              }
            } else {
              return (
                <ActivityListItem
                  key={(item.transactionIndex ?? 1) + index}
                  tx={item}
                  onPress={() => openTransactionDetails(item)}
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
      <ScrollableComponent children={renderItems()} />
    </View>
  )
}

export default ActivityList
