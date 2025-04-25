import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account'
import { Networks } from 'store/network'

const REFETCH_INTERVAL = 1000 * 60 * 5 // 5 minutes

export const useLastTransactedNetworks = (): UseQueryResult<
  Networks,
  Error
> => {
  const address = useSelector(selectActiveAccount)?.addressC ?? ''

  return useQuery({
    staleTime: REFETCH_INTERVAL,
    refetchInterval: REFETCH_INTERVAL,
    refetchIntervalInBackground: true,
    queryKey: [ReactQueryKeys.LAST_TRANSACTED_ERC20_NETWORKS, address],
    queryFn: () =>
      NetworkService.fetchLastTransactedERC20Networks({
        address
      })
  })
}
