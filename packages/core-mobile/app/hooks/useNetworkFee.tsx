import { Network } from '@avalabs/core-chains-sdk'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import Logger from 'utils/Logger'
import { NetworkFees } from '@avalabs/vm-module-types'

const REFETCH_INTERVAL = 30000 // 30 seconds

const getQueryKey = (
  network: Network | undefined
): [ReactQueryKeys, number | undefined] => [
  ReactQueryKeys.NETWORK_FEE,
  network?.chainId
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
  network: Network | undefined
): UseQueryResult<NetworkFees | undefined> => {
  return useQuery({
    enabled: network !== undefined,
    queryKey: getQueryKey(network),
    queryFn: async () => {
      if (network === undefined) {
        return Promise.reject('Invalid network')
      }

      return getQueryFn(network)()
    },
    refetchInterval: REFETCH_INTERVAL
  })
}
