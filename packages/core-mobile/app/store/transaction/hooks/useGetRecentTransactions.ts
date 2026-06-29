import { Network } from '@avalabs/core-chains-sdk'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { InteractionManager } from 'react-native'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account/slice'
import { selectIsLocked } from 'store/app/slice'
import { useGetRecentsTransactionsQuery } from '../api'
import { Transaction } from '../types'

const POLLING_INTERVAL_IN_MS = 15000

const emptyArr: Transaction[] = []

/**
 * a hook to get most recents transactions for the current active network & account
 *
 * fetch behaviors:
 *  - auto fetch transactions on component's first mount
 *  - while 1/ the component is mounted and focused and 2/ the app is not in a locked state,
 *    refetch transactions every 15 seconds
 *  - if active network/account changes,
 *    it will auto refetch if cached data is stale (after 60 seconds of being unused)
 *  - refetch transactions whenever the app is switched from another screen to portfolio screen
 *    except from react-native-tab-view screens
 */
export const useGetRecentTransactions = (
  network?: Network
): {
  transactions: Transaction[]
  isLoading: boolean
  isRefreshing: boolean
  isError: boolean
  refresh: () => void
} => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const account = useSelector(selectActiveAccount)
  const isAppLocked = useSelector(selectIsLocked)
  const {
    currentData: data,
    isFetching,
    refetch,
    isError
  } = useGetRecentsTransactionsQuery(
    {
      network,
      account
    },
    {
      skip: isAppLocked,
      pollingInterval: POLLING_INTERVAL_IN_MS
    }
  )

  useFocusEffect(
    useCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        refetch()
      })
    }, [refetch])
  )

  const refresh = useCallback(() => {
    // rtk query doesn't support differentiate between polling and manual refetch
    // so here we are faking a 1 second refreshing time when a manual refetch is called
    // this should only be used to show refresh indicator (in a ScrollView, Flatlist,...)
    setIsRefreshing(true)
    refetch()
    setTimeout(() => setIsRefreshing(false), 1000)
  }, [refetch])

  const isLoading = isFetching && !data

  return {
    transactions: data ?? emptyArr,
    isLoading,
    isRefreshing,
    isError,
    refresh
  }
}
