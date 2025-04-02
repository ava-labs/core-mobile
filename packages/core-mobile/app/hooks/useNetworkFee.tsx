import { Network } from '@avalabs/core-chains-sdk'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import Logger from 'utils/Logger'
import { NetworkFees } from '@avalabs/vm-module-types'
import { useNetworks } from './networks/useNetworks'

const REFETCH_INTERVAL = 30000 // 30 seconds

export const getQueryKey = (network: Network): [ReactQueryKeys, number] => [
  ReactQueryKeys.NETWORK_FEE,
  network.chainId
]

const getQueryFn = (network: Network) => () =>
  NetworkFeeService.getNetworkFee(network).catch(Logger.error)

export const prefetchNetworkFee = (network: Network | undefined): void => {
  if (network) {
    Logger.info('prefetching network fee', network.chainId)

    queryClient
      .prefetchQuery({
        queryKey: getQueryKey(network),
        queryFn: getQueryFn(network)
      })
      .catch(Logger.error)
  }
}

export const useNetworkFee = (
  network?: Network
): UseQueryResult<NetworkFees | undefined> => {
  const { activeNetwork } = useNetworks()
  const networkToRequest = network || activeNetwork

  return useQuery({
    queryKey: getQueryKey(networkToRequest),
    queryFn: getQueryFn(networkToRequest),
    refetchInterval: REFETCH_INTERVAL
  })
}
