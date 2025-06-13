import { useCallback, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectTokenVisibility } from 'store/portfolio'
import {
  fetchBalanceForAccount,
  QueryStatus,
  selectBalanceStatus,
  selectBalanceTotalInCurrencyForAccount,
  selectIsBalanceLoadedForAccount
} from 'store/balance'

export const useBalanceForAccount = (
  accountIndex: number
): {
  isBalanceLoaded: boolean
  fetchBalance: () => void
  isFetchingBalance: boolean
  balance: number
} => {
  const dispatch = useDispatch()
  const balanceStatus = useSelector(selectBalanceStatus)
  const isBalanceLoading = balanceStatus !== QueryStatus.IDLE
  const [isFetchingBalance, setIsFetchingBalance] = useState(true)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const accountBalance = useSelector(
    selectBalanceTotalInCurrencyForAccount(accountIndex, tokenVisibility)
  )

  const isBalanceLoaded = useSelector(
    selectIsBalanceLoadedForAccount(accountIndex)
  )

  const fetchBalance = useCallback(() => {
    dispatch(fetchBalanceForAccount({ accountIndex }))
    setIsFetchingBalance(true)
  }, [dispatch, accountIndex])

  useEffect(() => {
    if (!isBalanceLoading && isFetchingBalance) {
      setIsFetchingBalance(false)
    }
  }, [isFetchingBalance, isBalanceLoading, setIsFetchingBalance])

  return {
    balance: accountBalance,
    fetchBalance,
    isFetchingBalance,
    isBalanceLoaded
  }
}
