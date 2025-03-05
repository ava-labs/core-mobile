import { useDispatch, useSelector } from 'react-redux'
import { useState, useCallback } from 'react'
import { selectActiveAccount } from 'store/account/slice'
import { isAnyOf } from '@reduxjs/toolkit'
import { addAppListener } from 'store/middleware/listener'
import { useFocusEffect } from '@react-navigation/native'
import { popBridgeTransaction } from 'store/bridge/slice'
import { selectIsLocked } from 'store/app/slice'
import { Network } from '@avalabs/core-chains-sdk'
import { useGetRecentsTransactionsQuery } from '../api'
import { Transaction } from '../types'

const REFETCH_EVENTS = isAnyOf(popBridgeTransaction)

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
 *  - while the component is in focus,
 *    trigger a refetch when certain events occur (for ex, a pending bridge transaction finishes)
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
  const dispatch = useDispatch()
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

  // whenever the subscribed component is in focus
  // we will refetch transactions when certain events occur that are not part of the query args
  useFocusEffect(
    // @ts-ignore: unsubscribe from redux addListener has incorrect type
    useCallback(() => {
      return dispatch(
        addAppListener({
          matcher: REFETCH_EVENTS,
          effect: () => {
            refetch()
          }
        })
      )
    }, [dispatch, refetch])
  )

  useFocusEffect(
    useCallback(() => {
      refetch()
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
