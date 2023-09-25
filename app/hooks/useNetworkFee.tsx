import { Network } from '@avalabs/chains-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useSelector } from 'react-redux'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import { selectActiveNetwork } from 'store/network'

const initialData = {
  low: 0n,
  medium: 0n,
  high: 0n,
  displayDecimals: 0,
  nativeTokenDecimals: 0,
  unit: '',
  isFixedFee: false,
  nativeTokenSymbol: ''
}

const REFETCH_INTERVAL = 30000 // 30 seconds

export const useNetworkFee = (network?: Network) => {
  const activeNetwork = useSelector(selectActiveNetwork)
  const networkToRequest = network || activeNetwork

  return useQuery({
    initialData,
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ReactQueryKeys.NETWORK_FEE, networkToRequest.chainId],
    queryFn: () => NetworkFeeService.getNetworkFee(networkToRequest),
    select: data => {
      return data ?? initialData
    },
    refetchInterval: REFETCH_INTERVAL
  })
}
