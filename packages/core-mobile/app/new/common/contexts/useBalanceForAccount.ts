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
  accountUuid: string
): {
  isBalanceLoaded: boolean
  fetchBalance: () => void
  isFetchingBalance: boolean
  balance: number
} => {
  const dispatch = useDispatch()
  const balanceStatus = useSelector(selectBalanceStatus)
  const isBalanceLoading = balanceStatus !== QueryStatus.IDLE
  const [isFetchingBalance, setIsFetchingBalance] = useState(false)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const accountBalance = useSelector(
    selectBalanceTotalInCurrencyForAccount(accountUuid, tokenVisibility)
  )

  const isBalanceLoaded = useSelector(
    selectIsBalanceLoadedForAccount(accountUuid)
  )

  const fetchBalance = useCallback(() => {
    dispatch(fetchBalanceForAccount({ accountUuid }))
    setIsFetchingBalance(true)
  }, [dispatch, accountUuid])

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
