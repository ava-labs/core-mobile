import { useQueryClient } from '@tanstack/react-query'
import { balanceKey } from 'features/portfolio/hooks/useAccountBalances'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectEnabledNetworks } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useXPAddresses } from 'hooks/useXPAddresses/useXPAddresses'

export const useRefreshStakingBalances = (
  timeout = 2000
): (({ shouldRefreshStakes }: { shouldRefreshStakes: boolean }) => void) => {
  const queryClient = useQueryClient()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const { xpAddresses } = useXPAddresses(activeAccount)
  const enabledNetworks = useSelector(selectEnabledNetworks)

  return useCallback(
    ({ shouldRefreshStakes }: { shouldRefreshStakes: boolean }) => {
      setTimeout(() => {
        if (shouldRefreshStakes) {
          queryClient.invalidateQueries({
            queryKey: ['stakes', isDeveloperMode, xpAddresses.join(',')]
          })
        }
        queryClient.invalidateQueries({
          queryKey: balanceKey(activeAccount, Object.values(enabledNetworks))
        })
      }, timeout)
    },
    [
      queryClient,
      timeout,
      activeAccount,
      isDeveloperMode,
      enabledNetworks,
      xpAddresses
    ]
  )
}
