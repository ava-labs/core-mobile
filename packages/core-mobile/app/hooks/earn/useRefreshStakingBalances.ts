import { useQueryClient } from '@tanstack/react-query'
import { balanceKey } from 'features/portfolio/hooks/useAccountBalances'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useRefreshStakingBalances = (
  timeout = 2000
): (({ shouldRefreshStakes }: { shouldRefreshStakes: boolean }) => void) => {
  const queryClient = useQueryClient()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const pAddresses =
    activeAccount?.xpAddresses?.map(address => address.address) ?? []
  const pAddressesSorted = pAddresses.sort().join(',')

  return useCallback(
    ({ shouldRefreshStakes }: { shouldRefreshStakes: boolean }) => {
      setTimeout(() => {
        if (shouldRefreshStakes) {
          queryClient.invalidateQueries({
            queryKey: ['stakes', isDeveloperMode, pAddressesSorted]
          })
        }
        queryClient.invalidateQueries({
          queryKey: balanceKey(activeAccount)
        })
      }, timeout)
    },
    [queryClient, timeout, activeAccount, isDeveloperMode, pAddressesSorted]
  )
}
