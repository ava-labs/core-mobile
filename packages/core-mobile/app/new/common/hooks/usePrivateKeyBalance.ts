import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ImportedAccount } from 'store/account/types'
import { selectAccountById } from 'store/account'
import { useIsBalanceLoadedForAccount } from 'features/portfolio/hooks/useIsBalanceLoadedForAccount'
import { useBalanceTotalInCurrencyForAccount } from 'features/portfolio/hooks/useBalanceTotalInCurrencyForAccount'
import { useAccountBalances } from 'features/portfolio/hooks/useAccountBalances'
import { useFormatCurrency } from './useFormatCurrency'

export const usePrivateKeyBalance = (
  tempAccountDetails: ImportedAccount | null
): {
  totalBalanceDisplay: string | null
  isFetching: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const [totalBalanceDisplay, setTotalBalanceDisplay] = useState<string | null>(
    null
  )

  const dispatch = useDispatch()
  const { formatCurrency } = useFormatCurrency()

  const accountIdForBalance = tempAccountDetails ? tempAccountDetails.id : ''
  const account = useSelector(selectAccountById(accountIdForBalance))
  const { results, refetch } = useAccountBalances(account, {
    enabled: false
  })
  const currentTempAccountBalance = useBalanceTotalInCurrencyForAccount(account)
  const isOurBalanceDataLoadedInStore = useIsBalanceLoadedForAccount(account)

  const isFetching = useMemo(
    () => results.some(r => r.isLoading || r.isFetching),
    [results]
  )

  useEffect(() => {
    if (!tempAccountDetails || isFetching || isOurBalanceDataLoadedInStore) {
      return
    }
    refetch()
  }, [
    tempAccountDetails,
    dispatch,
    refetch,
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
