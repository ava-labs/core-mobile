import { QueryObserverResult, skipToken, useQuery } from '@tanstack/react-query'
import { PublicClient } from 'viem'
import { readContract } from 'viem/actions'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { type DefiMarket } from '../../types'
import {
  AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS,
  AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS
} from '../../consts'
import { AAVE_POOL_DATA_PROVIDER } from '../../abis/aavePoolDataProvider'
import { aaveInsertAvax } from '../../utils/aaveInsertAvax'
import { getAaveFilteredMarketData } from '../../utils/getAaveFilteredMarketData'
import { enrichAaveMarketData } from '../../utils/enrichAaveMarketData'
import { useGetCChainToken } from '../useGetCChainToken'
import { useMeritAprs } from './useMeritAprs'

export const useAaveAvailableMarkets = ({
  network,
  networkClient
}: {
  network: Network | undefined
  networkClient: PublicClient | undefined
}): {
  data: DefiMarket[] | undefined
  error: Error | null
  isLoading: boolean
  isPending: boolean
  isFetching: boolean
  refetch: () => Promise<QueryObserverResult<DefiMarket[], Error>>
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const addressEVM = activeAccount?.addressC
  const { data: meritAprs, isPending: isPendingMeritAprs } = useMeritAprs()
  const getCChainToken = useGetCChainToken()

  const { data, isLoading, isPending, isFetching, refetch, error } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS, networkClient?.chain?.id],
    queryFn:
      networkClient && network && !isPendingMeritAprs
        ? async () => {
            // Fetch all available reserve data from Aave V3 pool
            const [marketsData] = await readContract(networkClient, {
              address: AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS,
              abi: AAVE_POOL_DATA_PROVIDER,
              functionName: 'getReservesData',
              args: [AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS]
            })

            // Filter out inactive, paused, or frozen markets
            const filteredMarkets = getAaveFilteredMarketData(marketsData)

            // Enrich each market with additional data
            const results = await Promise.all(
              filteredMarkets.map(market =>
                enrichAaveMarketData({
                  market,
                  network,
                  networkClient,
                  addressEVM: addressEVM as string,
                  meritAprs,
                  getCChainToken
                })
              )
            )

            return aaveInsertAvax(results)
          }
        : skipToken
  })

  return {
    data,
    error,
    isLoading,
    isPending,
    isFetching,
    refetch
  }
}
