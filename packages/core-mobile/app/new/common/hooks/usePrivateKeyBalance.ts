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
      totalBalanceDisplay !== null
    ) {
      return
    }
    setIsAwaitingOurBalance(true)
    dispatch(fetchBalanceForAccount({ accountId: tempAccountDetails.id }))
  }, [tempAccountDetails, dispatch, isAwaitingOurBalance, totalBalanceDisplay])

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

  return {
    totalBalanceDisplay,
    isAwaitingOurBalance
  }
}
