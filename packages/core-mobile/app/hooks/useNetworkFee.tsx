import { Network } from '@avalabs/chains-sdk'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { useSelector } from 'react-redux'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import { selectActiveNetwork } from 'store/network'
import Logger from 'utils/Logger'

const defaultData = {
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

export const getQueryKey = (network: Network) => [
  ReactQueryKeys.NETWORK_FEE,
  network.chainId
]

const getQueryFn = (network: Network) => () =>
  NetworkFeeService.getNetworkFee(network)

export const prefetchNetworkFee = (network: Network | undefined) => {
  if (network) {
    Logger.info('prefetching network fee', network.chainId)

    queryClient.prefetchQuery({
      queryKey: getQueryKey(network),
      queryFn: getQueryFn(network)
    })
  }
}

export const useNetworkFee = (network?: Network) => {
  const activeNetwork = useSelector(selectActiveNetwork)
  const networkToRequest = network || activeNetwork

  const query = useQuery({
    queryKey: getQueryKey(networkToRequest),
    queryFn: getQueryFn(networkToRequest),
    refetchInterval: REFETCH_INTERVAL
  })

  return { ...query, data: query.data || defaultData }
}
