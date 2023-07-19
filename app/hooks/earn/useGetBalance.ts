import { useQuery } from '@tanstack/react-query'
import GlacierBalanceService from 'services/balance/GlacierBalanceService'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'

export const useGetBalance = () => {
  const addressPVM = useSelector(selectActiveAccount)?.addressPVM
  const network = useSelector(selectActiveNetwork)

  return useQuery({
    enabled: !!addressPVM,
    queryKey: ['stakingBalances', network, addressPVM],
    queryFn: async () =>
      GlacierBalanceService.getPChainBalance(
        network,
        addressPVM ? [addressPVM] : []
      )
  })
}
