import {
  ListTransactionDetailsDto,
  TransactionDetailsDto
} from '@avalabs/glacier-sdk'
import { useSelector } from 'react-redux'
import { useBridgeSDK } from '@avalabs/bridge-sdk'
import { selectActiveNetwork } from 'store/network'
import { useMemo } from 'react'
import { selectActiveAccount } from 'store/account'
import { useInfiniteScroll } from 'store/utils/useInfiniteScroll'
import { convertTransaction } from '../utils'
import { GetTransactionsArgs } from '../types'
import { useGetTransactionsQuery } from '../api'

// a hook to get transactions with pagination support for the current active network & account
export const useGetTransactions = () => {
  const network = useSelector(selectActiveNetwork)
  const account = useSelector(selectActiveAccount)

  const { data, fetchNext, refresh, isLoading, isRefreshing } =
    useInfiniteScroll<
      GetTransactionsArgs,
      ListTransactionDetailsDto,
      TransactionDetailsDto
    >({
      useQuery: useGetTransactionsQuery,
      queryParams: { network, account },
      dataKey: 'transactions'
    })

  const { bitcoinAssets, ethereumWrappedAssets } = useBridgeSDK()

  const transactions = useMemo(() => {
    if (data && data.length > 0 && account) {
      return data.map(item =>
        convertTransaction({
          item,
          network,
          account,
          ethereumWrappedAssets,
          bitcoinAssets
        })
      )
    }

    return []
  }, [account, bitcoinAssets, data, ethereumWrappedAssets, network])

  return { transactions, isLoading, isRefreshing, fetchNext, refresh }
}
