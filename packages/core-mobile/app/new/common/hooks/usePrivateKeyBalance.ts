import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchBalanceForAccount,
  selectBalanceTotalInCurrencyForAccount,
  selectIsBalanceLoadedForAccount
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { ImportedAccount } from 'store/account/types'
import { useFormatCurrency } from './useFormatCurrency'

export const usePrivateKeyBalance = (
  tempAccountDetails: ImportedAccount | null
): {
  totalBalanceDisplay: string | null
  isAwaitingOurBalance: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const [totalBalanceDisplay, setTotalBalanceDisplay] = useState<string | null>(
    null
  )
  const [isAwaitingOurBalance, setIsAwaitingOurBalance] = useState(false)

  const dispatch = useDispatch()
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
    if (
      !tempAccountDetails ||
      isAwaitingOurBalance ||
      isOurBalanceDataLoadedInStore
    ) {
      return
    }
    setIsAwaitingOurBalance(true)
    dispatch(fetchBalanceForAccount({ account: tempAccountDetails }))
  }, [
    tempAccountDetails,
    dispatch,
    isAwaitingOurBalance,
    totalBalanceDisplay,
    isOurBalanceDataLoadedInStore,
    currentTempAccountBalance
  ])

  // Effect to handle balance fetch completion
  useEffect(() => {
    if (isAwaitingOurBalance && isOurBalanceDataLoadedInStore) {
      setIsAwaitingOurBalance(false)
    }
  }, [isAwaitingOurBalance, isOurBalanceDataLoadedInStore])

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

  useEffect(() => {
    if (isAwaitingOurBalance) {
      const timeout = setTimeout(() => {
        setIsAwaitingOurBalance(false)
      }, 10000) // 10 second timeout

      // Clear timeout if balance loads
      if (isOurBalanceDataLoadedInStore) {
        clearTimeout(timeout)
        setIsAwaitingOurBalance(false)
      }

      return () => clearTimeout(timeout)
    }
  }, [isAwaitingOurBalance, isOurBalanceDataLoadedInStore])

  return {
    totalBalanceDisplay,
    isAwaitingOurBalance
  }
}
