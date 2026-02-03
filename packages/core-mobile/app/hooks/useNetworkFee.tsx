import { Network } from '@avalabs/core-chains-sdk'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import NetworkFeeService from 'services/networkFee/NetworkFeeService'
import Logger from 'utils/Logger'
import { NetworkFees } from '@avalabs/vm-module-types'

const DEFAULT_REFETCH_INTERVAL = 30000 // 30 seconds

const getQueryKey = (
  network: Network | undefined,
  keyPrefix?: string
): [ReactQueryKeys, number | undefined, string?] => [
  ReactQueryKeys.NETWORK_FEE,
  network?.chainId,
  keyPrefix
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

type UseNetworkFeeOptions = {
  /** Custom key prefix to isolate this query from other useNetworkFee calls */
  keyPrefix?: string
  /** Override refetch interval. Set to false to disable periodic refetch */
  refetchInterval?: number | false
}

export const useNetworkFee = (
  network: Network | undefined,
  options?: UseNetworkFeeOptions
): UseQueryResult<NetworkFees | undefined> => {
  return useQuery({
    enabled: network !== undefined,
    queryKey: getQueryKey(network, options?.keyPrefix),
    queryFn: async () => {
      if (network === undefined) {
        return Promise.reject('Invalid network')
      }

      return getQueryFn(network)()
    },
    refetchInterval: options?.refetchInterval ?? DEFAULT_REFETCH_INTERVAL
  })
}
