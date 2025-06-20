import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchBalanceForAccount,
  selectBalanceStatus,
  selectBalanceTotalInCurrencyForAccount,
  QueryStatus,
  selectIsBalanceLoadedForAccount
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { ImportedAccount } from 'store/account/types'
import Logger from 'utils/Logger'
import { useFormatCurrency } from './useFormatCurrency'

export const usePrivateKeyBalance = (
  tempAccountDetails: ImportedAccount | null
): {
  totalBalanceDisplay: string | null
  isAwaitingOurBalance: boolean
} => {
  const [totalBalanceDisplay, setTotalBalanceDisplay] = useState<string | null>(
    null
  )
  const [isAwaitingOurBalance, setIsAwaitingOurBalance] = useState(false)

  const dispatch = useDispatch()
  const globalBalanceQueryStatus = useSelector(selectBalanceStatus)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const { formatCurrency } = useFormatCurrency()

  const accountIdForBalance = tempAccountDetails ? tempAccountDetails.id : ''
  const currentTempAccountBalance = useSelector(
    selectBalanceTotalInCurrencyForAccount(accountIdForBalance, tokenVisibility)
  )
  const isOurBalanceDataLoadedInStore = useSelector(
    selectIsBalanceLoadedForAccount(accountIdForBalance)
  )

  useEffect(() => {
    if (!tempAccountDetails || isAwaitingOurBalance) {
      return
    }
    if (
      globalBalanceQueryStatus === QueryStatus.IDLE &&
      totalBalanceDisplay === null
    ) {
      Logger.info(
        'Dispatching fetchBalanceForAccount for temp account:',
        tempAccountDetails.id
      )
      setIsAwaitingOurBalance(true)
      dispatch(fetchBalanceForAccount({ accountId: tempAccountDetails.id }))
    } else if (globalBalanceQueryStatus !== QueryStatus.IDLE) {
      Logger.info(
        'Global balance fetching busy, deferring fetch for PK account.'
      )
    }
  }, [
    tempAccountDetails,
    dispatch,
    isAwaitingOurBalance,
    globalBalanceQueryStatus,
    totalBalanceDisplay
  ])

  // Effect to handle balance fetch completion
  useEffect(() => {
    if (
      isAwaitingOurBalance &&
      (isOurBalanceDataLoadedInStore ||
        globalBalanceQueryStatus === QueryStatus.IDLE)
    ) {
      setIsAwaitingOurBalance(false)
      if (isOurBalanceDataLoadedInStore) {
        Logger.info('Balance data for our temp account ID confirmed in store.')
      } else {
        Logger.info(
          'Global balance query idle, fetch for temp account assumed complete/included.'
        )
      }
    }
  }, [
    isAwaitingOurBalance,
    isOurBalanceDataLoadedInStore,
    globalBalanceQueryStatus
  ])

  // Effect to update balance display
  useEffect(() => {
    if (!tempAccountDetails) {
      setTotalBalanceDisplay(null)
      return
    }
    if (isAwaitingOurBalance && !isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay('(Fetching...)')
    } else if (isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay(
        formatCurrency({ amount: currentTempAccountBalance })
      )
    } else if (!isAwaitingOurBalance && !isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay('(No balance data)')
    } else {
      setTotalBalanceDisplay(null)
    }
  }, [
    tempAccountDetails,
    currentTempAccountBalance,
    isAwaitingOurBalance,
    isOurBalanceDataLoadedInStore,
    formatCurrency
  ])

  // Reset state when tempAccountDetails changes
  useEffect(() => {
    if (!tempAccountDetails) {
      setIsAwaitingOurBalance(false)
      setTotalBalanceDisplay(null)
    }
  }, [tempAccountDetails])

  return {
    totalBalanceDisplay,
    isAwaitingOurBalance
  }
}
