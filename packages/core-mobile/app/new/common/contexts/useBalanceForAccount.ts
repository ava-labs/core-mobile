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
import { selectAccountByUuid } from 'store/account'

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
  const account = useSelector(selectAccountByUuid(accountUuid))

  const isBalanceLoaded = useSelector(
    selectIsBalanceLoadedForAccount(accountUuid)
  )

  const fetchBalance = useCallback(() => {
    if (account) {
      dispatch(fetchBalanceForAccount({ account }))
      setIsFetchingBalance(true)
    }
  }, [dispatch, account])

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
