import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectActiveAccount } from 'store/account'
import { Networks } from 'store/network'

export const useLastTransactedNetworks = ({
  staleTime,
  refetchInterval = false,
  refetchIntervalInBackground = false
}: {
  staleTime?: number
  refetchInterval?: number | false
  refetchIntervalInBackground?: boolean
}): UseQueryResult<Networks, Error> => {
  const address = useSelector(selectActiveAccount)?.addressC ?? ''

  return useQuery({
    staleTime,
    refetchInterval,
    refetchIntervalInBackground,
    queryKey: [ReactQueryKeys.LAST_TRANSACTED_ERC20_NETWORKS, address],
    queryFn: () =>
      NetworkService.fetchLastTransactedERC20Networks({
        address
      })
  })
}
