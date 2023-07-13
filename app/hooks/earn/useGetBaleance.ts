import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import EarnService from 'services/earn/EarnService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { Network } from '@avalabs/chains-sdk'

export const useGetBalance = (network: Network, addresses: string[]) => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: ['stakingBalances', isDeveloperMode, network, addresses],
    queryFn: async () => {
      return EarnService.getPChainBalance(network, addresses)
    }
  })
}
