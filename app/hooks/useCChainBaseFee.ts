import { Avalanche } from '@avalabs/wallets-sdk'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const REFETCH_INTERVAL = 10000 // 10 seconds

/**
 * a query to fetch c chain base fee
 *
 * more info about base fee here:
 * https://docs.avax.network/quickstart/transaction-fees#c-chain-fees
 */
export const useCChainBaseFee = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxXPNetwork = NetworkService.getAvalancheNetworkXP(isDeveloperMode)
  const avaxProvider = NetworkService.getProviderForNetwork(
    avaxXPNetwork
  ) as Avalanche.JsonRpcProvider

  return useQuery({
    refetchInterval: REFETCH_INTERVAL,
    queryKey: ['cChainBaseFee', isDeveloperMode],
    queryFn: () => {
      return avaxProvider.getApiC().getBaseFee()
    }
  })
}
