import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useAvalancheXpProvider } from './networks/networkProviderHooks'

const REFETCH_INTERVAL = 30000 // 30 seconds

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
  const cChainNetwork = useCChainNetwork()
  const avaxProvider = useAvalancheXpProvider(isDeveloperMode)

  return useQuery({
    // no need to retry failed request as we are already doing interval fetching
    retry: false,
    refetchInterval: REFETCH_INTERVAL,
    queryKey: ['cChainBaseFee', isDeveloperMode, cChainNetwork, avaxProvider],
    enabled: !!avaxProvider && !!cChainNetwork,
    queryFn: async () => {
      if (!cChainNetwork || !avaxProvider) {
        return Promise.reject('cChainNetwork or avaxProvider is not available')
      }

      const baseFeeWei = await avaxProvider.getApiC().getBaseFee()

      return new TokenUnit(
        baseFeeWei,
        cChainNetwork.networkToken.decimals,
        cChainNetwork.networkToken.symbol
      )
    }
  })
}
