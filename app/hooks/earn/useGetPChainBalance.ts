import { useQuery } from '@tanstack/react-query'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectIsDeveloperMode } from 'store/settings/advanced'

export const useGetPChainBalance = () => {
  const addressPVM = useSelector(selectActiveAccount)?.addressPVM
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    enabled: !!addressPVM,
    queryKey: ['pChainBalance', isDeveloperMode, addressPVM],
    queryFn: async () =>
      GlacierBalanceService.getPChainBalance(
        isDeveloperMode,
        addressPVM ? [addressPVM] : []
      )
  })
}
