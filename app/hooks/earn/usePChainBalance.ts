import { useQuery } from '@tanstack/react-query'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const POLLING_INTERVAL = 10000 // 10 seconds

export const usePChainBalance = () => {
  const addressPVM = useSelector(selectActiveAccount)?.addressPVM
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    refetchInterval: POLLING_INTERVAL,
    enabled: !!addressPVM,
    queryKey: ['pChainBalance', isDeveloperMode, addressPVM],
    queryFn: async () =>
      GlacierBalanceService.getPChainBalance(
        isDeveloperMode,
        addressPVM ? [addressPVM] : []
      )
  })
}
