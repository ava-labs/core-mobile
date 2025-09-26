import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'

export const useRefreshStakingBalances = (
  timeout = 2000
): (({ shouldRefreshStakes }: { shouldRefreshStakes: boolean }) => void) => {
  const queryClient = useQueryClient()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  return useCallback(
    ({ shouldRefreshStakes }: { shouldRefreshStakes: boolean }) => {
      setTimeout(() => {
        const pAddress = activeAccount?.addressPVM ?? ''
        const cAddress = activeAccount?.addressC ?? ''

        if (shouldRefreshStakes) {
          queryClient.invalidateQueries({
            queryKey: ['stakes', isDeveloperMode, pAddress]
          })
        }
        queryClient.invalidateQueries({
          queryKey: ['pChainBalance', isDeveloperMode, pAddress]
        })
        queryClient.invalidateQueries({
          queryKey: [
            'cChainBalance',
            isDeveloperMode,
            cAddress,
            selectedCurrency
          ]
        })
      }, timeout)
    },
    [queryClient, timeout, activeAccount, isDeveloperMode, selectedCurrency]
  )
}
