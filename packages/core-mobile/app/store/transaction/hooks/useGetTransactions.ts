import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useInfiniteScroll } from 'store/utils/useInfiniteScroll'
import { ActivityResponse } from 'services/activity/types'
import { selectBridgeCriticalConfig } from 'store/bridge'
import { useNetworks } from 'hooks/useNetworks'
import { GetTransactionsArgs, Transaction } from '../types'
import { useGetTransactionsQuery } from '../api'

// a hook to get transactions with pagination support for the current active network & account
export const useGetTransactions = (): {
  transactions: Transaction[]
  isLoading: boolean
  isRefreshing: boolean
  isFirstPage: boolean
  fetchNext: () => void
  refresh: () => void
} => {
  const { activeNetwork } = useNetworks()
  const account = useSelector(selectActiveAccount)
  const criticalConfig = useSelector(selectBridgeCriticalConfig)

  const { data, fetchNext, refresh, isLoading, isRefreshing, isFirstPage } =
    useInfiniteScroll<GetTransactionsArgs, ActivityResponse, Transaction>({
      useQuery: useGetTransactionsQuery,
      queryParams: { network: activeNetwork, account, criticalConfig },
      dataKey: 'transactions'
    })

  return {
    transactions: data,
    isLoading,
    isRefreshing,
    isFirstPage,
    fetchNext,
    refresh
  }
}
