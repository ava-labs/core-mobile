import { Avalanche } from '@avalabs/core-wallets-sdk'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const REFETCH_INTERVAL = 10000 // 10 seconds

/**
 * a query to fetch c chain base fee (in wei)
 *
 * more info about base fee here:
 * https://docs.avax.network/quickstart/transaction-fees#c-chain-fees
 */
export const useCChainBaseFee = (): UseQueryResult<bigint, Error> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDeveloperMode)
  const avaxProvider = NetworkService.getProviderForNetwork(
    avaxXPNetwork
  ) as Avalanche.JsonRpcProvider

  return useQuery({
    // no need to retry failed request as we are already doing interval fetching
    retry: false,
    refetchInterval: REFETCH_INTERVAL,
    queryKey: ['cChainBaseFee', isDeveloperMode],
    queryFn: () => {
      return avaxProvider.getApiC().getBaseFee()
    }
  })
}
