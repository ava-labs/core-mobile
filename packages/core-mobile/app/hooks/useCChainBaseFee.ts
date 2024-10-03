import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'

const REFETCH_INTERVAL = 10000 // 10 seconds

/**
 * a query to fetch c chain base fee
 *
 * more info about base fee here:
 * https://docs.avax.network/quickstart/transaction-fees#c-chain-fees
 */
export const useCChainBaseFee = (): UseQueryResult<
  TokenUnit | undefined,
  Error
> => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxProvider = NetworkService.getAvalancheProviderXP(isDeveloperMode)
  const cChainNetwork = useCChainNetwork()

  return useQuery({
    // no need to retry failed request as we are already doing interval fetching
    retry: false,
    refetchInterval: REFETCH_INTERVAL,
    queryKey: ['cChainBaseFee', isDeveloperMode, cChainNetwork],
    queryFn: async () => {
      const baseFeeWei = await avaxProvider.getApiC().getBaseFee()
      if (!cChainNetwork) return undefined
      return new TokenUnit(
        baseFeeWei,
        cChainNetwork.networkToken.decimals,
        cChainNetwork.networkToken.symbol
      )
    }
  })
}
