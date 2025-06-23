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
import { selectAccountById } from 'store/account'

export const useBalanceForAccount = (
  accountId: string
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
    selectBalanceTotalInCurrencyForAccount(accountId, tokenVisibility)
  )
  const account = useSelector(selectAccountById(accountId))

  const isBalanceLoaded = useSelector(
    selectIsBalanceLoadedForAccount(accountId)
  )

  const fetchBalance = useCallback(() => {
    if (account) {
      dispatch(fetchBalanceForAccount({ account }))
      setIsFetchingBalance(true)
    }
  }, [account, dispatch])

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
