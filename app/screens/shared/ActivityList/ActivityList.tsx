import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { BridgeTransactionStatusParams } from 'navigation/types'
import { Row } from 'components/Row'
import DropDown, { OptionsItemInfo } from 'components/Dropdown'
import { Space } from 'components/Space'
import { useGetRecentTransactions } from 'store/transaction'
import { Transaction } from 'store/transaction'
import { ActivityLoader } from './ActivityLoader'
import Transactions from './Transactions'

enum ActivityFilter {
  All = 'All',
  Contract = 'Contract Call',
  Incoming = 'Incoming',
  Outgoing = 'Outgoing',
  Bridge = 'Bridge'
}

const filterOptions = [
  ActivityFilter.All,
  ActivityFilter.Contract,
  ActivityFilter.Incoming,
  ActivityFilter.Outgoing,
  ActivityFilter.Bridge
]

interface Props {
  embedded?: boolean
  tokenSymbolFilter?: string
  openTransactionDetails: (item: Transaction) => void
  openTransactionStatus: (params: BridgeTransactionStatusParams) => void
}

const ActivityList = ({
  embedded,
  tokenSymbolFilter,
  openTransactionDetails,
  openTransactionStatus
}: Props) => {
  const { transactions, refresh, isLoading, isRefreshing } =
    useGetRecentTransactions()
  const [filter, setFilter] = useState(ActivityFilter.All)

  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter(tx => {
          switch (filter) {
            case ActivityFilter.Contract:
              return tx.isContractCall
            case ActivityFilter.Incoming:
              return tx.isIncoming && !tx.isBridge
            case ActivityFilter.Outgoing:
              return tx.isOutgoing
            case ActivityFilter.All:
              return true
            case ActivityFilter.Bridge:
              return tx.isBridge
            default:
              return false
          }
        })
        .filter(tx => {
          return tokenSymbolFilter && tx.token?.symbol
            ? tokenSymbolFilter === tx.token.symbol
            : true
        }),
    [transactions, tokenSymbolFilter, filter]
  )

  const renderHeader = () => (
    <AvaText.LargeTitleBold
      textStyle={{ marginHorizontal: 16 }}
      testID="activity_list__header">
      Activity
    </AvaText.LargeTitleBold>
  )

  const renderFilterDropdown = () => {
    const renderSelection = (selectedItem: ActivityFilter) => (
      <SelectionRenderItem text={selectedItem} />
    )

    const renderOptions = (item: OptionsItemInfo<ActivityFilter>) => (
      <OptionsRenderItem text={item.item} />
    )

    return (
      <Row
        style={{
          justifyContent: 'flex-end',
          paddingHorizontal: 16,
          marginTop: 8
        }}>
        <DropDown
          testID="activity_list__filter_dropdown"
          alignment={'flex-end'}
          width={200}
          data={filterOptions}
          selectedIndex={selectedFilter}
          selectionRenderItem={renderSelection}
          onItemSelected={selectedItem => setFilter(selectedItem)}
          optionsRenderItem={renderOptions}
        />
      </Row>
    )
  }

  const renderTransactions = () => {
    return (
      <Transactions
        testID="transaction"
        data={filteredTransactions}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        openTransactionDetails={openTransactionDetails}
        openTransactionStatus={openTransactionStatus}
        hidePendingBridgeTransactions={Boolean(embedded)} // only show pending bridge transactions in the Activity Tab
      />
    )
  }

  const selectedFilter = filterOptions.findIndex(option => option === filter)

  const renderContents = () => {
    if (isLoading) return <ActivityLoader />

    return renderTransactions()
  }

  return (
    <View style={{ flex: 1 }}>
      {!embedded && renderHeader()}
      {renderFilterDropdown()}
      <Space y={10} />
      {renderContents()}
    </View>
  )
}

const SelectionRenderItem = ({ text }: { text: string }) => {
  return (
    <AvaText.ButtonSmall testID={`activity_list__current_filter`}>
      Display: {text}
    </AvaText.ButtonSmall>
  )
}

const OptionsRenderItem = ({ text }: { text: string }) => {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <AvaText.Body1 testID={`activity_list__filter_${text}`}>
        {text}
      </AvaText.Body1>
    </View>
  )
}

export default ActivityList
