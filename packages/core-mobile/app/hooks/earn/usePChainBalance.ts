import { useQuery } from '@tanstack/react-query'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { refetchIntervals } from 'consts/earn'

export const usePChainBalance = () => {
  const addressPVM = useSelector(selectActiveAccount)?.addressPVM
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    refetchInterval: refetchIntervals.balance,
    enabled: !!addressPVM,
    queryKey: ['pChainBalance', isDeveloperMode, addressPVM],
    queryFn: async () =>
      GlacierBalanceService.getPChainBalance(
        isDeveloperMode,
        addressPVM ? [addressPVM] : []
      )
  })
}
