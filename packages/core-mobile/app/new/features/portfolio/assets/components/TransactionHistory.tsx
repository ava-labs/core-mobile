import { Image, Separator } from '@avalabs/k2-alpine'
import React, { FC, useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { LocalTokenWithBalance } from 'store/balance'
import { Transaction, useGetRecentTransactions } from 'store/transaction'
import { isXpTransaction } from 'common/utils/isXpTransactions'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { useNetworks } from 'hooks/networks/useNetworks'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useTokenDetailFilterAndSort } from '../hooks/useTokenDetailFilterAndSort'
import { XpActivityListItem } from './XpActivityListItem'
import { TokenActivityListItem } from './TokenActivityListItem'

interface Props {
  token?: LocalTokenWithBalance
  handleExplorerLink: (explorerLink: string) => void
}

const TransactionHistory: FC<Props> = ({
  token,
  handleExplorerLink
}): React.JSX.Element => {
  const { getNetwork } = useNetworks()

  const network = useMemo(() => {
    return getNetwork(token?.networkChainId)
  }, [token, getNetwork])

  const { transactions, refresh, isLoading, isRefreshing, isError } =
    useGetRecentTransactions(network)

  const transactionsBySymbol = useMemo(() => {
    return transactions.filter(tx => {
      return (
        !token?.symbol ||
        (tx.tokens[0]?.symbol && token.symbol === tx.tokens[0].symbol)
      )
    })
  }, [token, transactions])

  const { data, filter, sort } = useTokenDetailFilterAndSort({
    transactions: transactionsBySymbol
  })

  const emptyComponent = useMemo(() => {
    if (isLoading || isRefreshing) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (isError) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
          description="Please hit refresh or try again later"
          button={{
            title: 'Refresh',
            onPress: refresh
          }}
        />
      )
    }

    return (
      <ErrorState
        sx={{ height: portfolioTabContentHeight }}
        icon={
          <Image
            source={require('../../../../assets/icons/unamused_emoji.png')}
            sx={{ width: 42, height: 42 }}
          />
        }
        title="No recent transactions"
        description="Interact with this token onchain and see your activity here"
      />
    )
  }, [isError, isLoading, isRefreshing, refresh])

  const renderItem = useCallback(
    (item: Transaction, index: number): React.JSX.Element => {
      const isXpTx =
        isXpTransaction(item.txType) &&
        token &&
        (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token))

      const props = {
        tx: item,
        index,
        onPress: () => handleExplorerLink(item.explorerLink)
      }

      if (isXpTx) {
        return <XpActivityListItem {...props} key={item.hash} />
      }
      return <TokenActivityListItem {...props} key={item.hash} />
    },
    [handleExplorerLink, token]
  )

  const dataLength = data.length

  const dropdowns = useMemo(() => {
    if (dataLength === 0) return

    return (
      <DropdownSelections filter={filter} sort={sort} sx={styles.dropdown} />
    )
  }, [dataLength, filter, sort])

  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 63 }} />
  }, [])

  return (
    <CollapsibleTabs.FlatList
      contentContainerStyle={{ overflow: 'visible', paddingBottom: 16 }}
      data={data}
      renderItem={item => renderItem(item.item, item.index)}
      ListHeaderComponent={dropdowns}
      ListEmptyComponent={emptyComponent}
      ItemSeparatorComponent={renderSeparator}
      showsVerticalScrollIndicator={false}
      keyExtractor={item => item.hash}
    />
  )
}

const styles = StyleSheet.create({
  dropdown: { paddingHorizontal: 16, marginTop: 14, marginBottom: 16 }
})

export default TransactionHistory
