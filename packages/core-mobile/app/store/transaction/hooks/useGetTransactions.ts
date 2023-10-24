import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { useInfiniteScroll } from 'store/utils/useInfiniteScroll'
import { ActivityResponse } from 'services/activity/types'
import { selectBridgeCriticalConfig } from 'store/bridge'
import { GetTransactionsArgs, Transaction } from '../types'
import { useGetTransactionsQuery } from '../api'

// a hook to get transactions with pagination support for the current active network & account
export const useGetTransactions = () => {
  const network = useSelector(selectActiveNetwork)
  const account = useSelector(selectActiveAccount)
  const criticalConfig = useSelector(selectBridgeCriticalConfig)

  const { data, fetchNext, refresh, isLoading, isRefreshing, isFirstPage } =
    useInfiniteScroll<GetTransactionsArgs, ActivityResponse, Transaction>({
      useQuery: useGetTransactionsQuery,
      queryParams: { network, account, criticalConfig },
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
