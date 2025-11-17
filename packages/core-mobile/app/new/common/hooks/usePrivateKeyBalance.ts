import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { ImportedAccount } from 'store/account/types'
import { useIsBalanceLoadedForAccount } from 'features/portfolio/hooks/useIsBalanceLoadedForAccount'
import { useBalanceTotalInCurrencyForAccount } from 'features/portfolio/hooks/useBalanceTotalInCurrencyForAccount'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { useFormatCurrency } from './useFormatCurrency'

export const usePrivateKeyBalance = (
  tempAccountDetails: ImportedAccount | null
): {
  totalBalanceDisplay: string | null
  isFetching: boolean
} => {
  const [totalBalanceDisplay, setTotalBalanceDisplay] = useState<string | null>(
    null
  )

  const dispatch = useDispatch()
  const { formatCurrency } = useFormatCurrency()

  const account = tempAccountDetails ?? undefined
  const { isLoading, isFetching, refetch } = useAccountBalances(account, {
    refetchInterval: 60000 // 1 minute
  })
  const currentTempAccountBalance = useBalanceTotalInCurrencyForAccount({
    account
  })
  const isOurBalanceDataLoadedInStore = useIsBalanceLoadedForAccount(account)

  useEffect(() => {
    if (
      !tempAccountDetails ||
      isLoading ||
      isFetching ||
      isOurBalanceDataLoadedInStore
    ) {
      return
    }
    refetch()
  }, [
    tempAccountDetails,
    dispatch,
    refetch,
    isLoading,
    isFetching,
    totalBalanceDisplay,
    isOurBalanceDataLoadedInStore,
    currentTempAccountBalance
  ])

  // Effect to update balance display
  useEffect(() => {
    if (!tempAccountDetails) {
      setTotalBalanceDisplay(null)
      return
    }
    if (isFetching && !isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay('(Fetching...)')
    } else if (isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay(
        formatCurrency({ amount: currentTempAccountBalance })
      )
    } else if (!isFetching && !isOurBalanceDataLoadedInStore) {
      setTotalBalanceDisplay('(No balance data)')
    } else {
      setTotalBalanceDisplay(null)
    }
  }, [
    tempAccountDetails,
    currentTempAccountBalance,
    isFetching,
    isOurBalanceDataLoadedInStore,
    formatCurrency
  ])

  // Reset state when tempAccountDetails changes
  useEffect(() => {
    if (!tempAccountDetails) {
      setTotalBalanceDisplay(null)
    }
  }, [tempAccountDetails])

  return {
    totalBalanceDisplay,
    isFetching
  }
}
