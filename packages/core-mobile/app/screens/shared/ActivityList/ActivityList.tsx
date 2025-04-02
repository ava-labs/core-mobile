import React, { useMemo, useState } from 'react'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import { BridgeTransactionStatusParams } from 'navigation/types'
import { Row } from 'components/Row'
import DropDown, { OptionsItemInfo } from 'components/Dropdown'
import { Space } from 'components/Space'
import { useGetRecentTransactions } from 'store/transaction/hooks'
import { TransactionType } from '@avalabs/vm-module-types'
import { useNetworks } from 'hooks/networks/useNetworks'
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
  tokenSymbolFilter?: string
  openTransactionStatus: (params: BridgeTransactionStatusParams) => void
}

const ActivityList = ({
  tokenSymbolFilter,
  openTransactionStatus
}: Props): React.JSX.Element => {
  const { activeNetwork } = useNetworks()
  const { transactions, refresh, isLoading, isRefreshing } =
    useGetRecentTransactions(activeNetwork)
  const [filter, setFilter] = useState(ActivityFilter.All)

  const filteredTransactions = useMemo(
    () =>
      transactions
        .filter(tx => {
          switch (filter) {
            case ActivityFilter.Contract:
              return tx.isContractCall
            case ActivityFilter.Incoming:
              return tx.isIncoming && tx.txType !== TransactionType.BRIDGE
            case ActivityFilter.Outgoing:
              return tx.isOutgoing
            case ActivityFilter.All:
              return true
            case ActivityFilter.Bridge:
              return tx.txType === TransactionType.BRIDGE
            default:
              return false
          }
        })
        .filter(tx => {
          return (
            !tokenSymbolFilter ||
            (tx.tokens[0]?.symbol && tokenSymbolFilter === tx.tokens[0].symbol)
          )
        }),
    [transactions, tokenSymbolFilter, filter]
  )

  const renderFilterDropdown = (): React.JSX.Element => {
    const renderSelection = (
      selectedItem: ActivityFilter
    ): React.JSX.Element => <SelectionRenderItem text={selectedItem} />

    const renderOptions = (
      item: OptionsItemInfo<ActivityFilter>
    ): React.JSX.Element => <OptionsRenderItem text={item.item} />

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

  const renderTransactions = (): React.JSX.Element => {
    return (
      <Transactions
        testID="transaction"
        data={filteredTransactions}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        openTransactionStatus={openTransactionStatus}
      />
    )
  }

  const selectedFilter = filterOptions.findIndex(option => option === filter)

  const renderContents = (): React.JSX.Element => {
    if (isLoading) return <ActivityLoader />

    return renderTransactions()
  }

  return (
    <View style={{ flex: 1 }} testID="activity_tab">
      {renderFilterDropdown()}
      <Space y={10} />
      {renderContents()}
    </View>
  )
}

const SelectionRenderItem = ({ text }: { text: string }): React.JSX.Element => {
  return (
    <AvaText.ButtonSmall testID={`activity_list__current_filter`}>
      Display: {text}
    </AvaText.ButtonSmall>
  )
}

const OptionsRenderItem = ({ text }: { text: string }): React.JSX.Element => {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <AvaText.Body1 testID={`activity_list__filter_${text}`}>
        {text}
      </AvaText.Body1>
    </View>
  )
}

export default ActivityList
