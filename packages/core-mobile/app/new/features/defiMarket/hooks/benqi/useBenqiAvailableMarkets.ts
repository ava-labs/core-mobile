import { QueryObserverResult, skipToken, useQuery } from '@tanstack/react-query'
import { readContract } from 'viem/actions'
import { DefiMarket, MarketNames } from 'features/defiMarket/types'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Address, PublicClient } from 'viem'
import { BENQI_COMPTROLLER } from 'features/defiMarket/abis/benqiComptroller'
import { BENQI_COMPTROLLER_C_CHAIN_ADDRESS } from 'features/defiMarket/consts'
import Logger from 'utils/Logger'
import { getBenqiDepositedBalance } from 'features/defiMarket/utils/getBenqiDepositedBalance'
import { getBenqiSupplyApyPercent } from 'features/defiMarket/utils/getBenqiLiveApy'
import { getBenqiUnderlyingTokenDetails } from 'features/defiMarket/utils/getBenqiUnderlyingTokenDetails'
import { getBenqiUnderlyingTotalSupply } from 'features/defiMarket/utils/getBenqiUnderlyingTotalSupply'
import { getUniqueMarketId } from 'features/defiMarket/utils/getUniqueMarketId'
import { Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useGetCChainToken } from '../useGetCChainToken'

export const useBenqiAvailableMarkets = ({
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
  const getCChainToken = useGetCChainToken()

  const { data, isLoading, isPending, isFetching, error, refetch } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.BENQI_AVAILABLE_MARKETS,
      networkClient?.chain?.id
    ],
    queryFn:
      networkClient && network
        ? async () => {
            const qTokenAddresses = (await readContract(networkClient, {
              address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
              abi: BENQI_COMPTROLLER,
              functionName: 'getAllMarkets',
              args: []
            })) as Address[]

            const results = await Promise.allSettled(
              qTokenAddresses.map(async qTokenAddress => {
                try {
                  const isPaused = await readContract(networkClient, {
                    address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
                    abi: BENQI_COMPTROLLER,
                    functionName: 'mintGuardianPaused',
                    args: [qTokenAddress]
                  })

                  // We don't currently show paused markets
                  if (isPaused) {
                    return undefined
                  }

                  const {
                    underlyingTokenAddress,
                    underlyingTokenName,
                    underlyingTokenDecimals,
                    underlyingTokenSymbol
                  } = await getBenqiUnderlyingTokenDetails({
                    cChainClient: networkClient,
                    qTokenAddress
                  })

                  const underlyingTotalSupply =
                    await getBenqiUnderlyingTotalSupply({
                      cChainClient: networkClient,
                      qTokenAddress,
                      underlyingTokenDecimals
                    })

                  const supplyApyPercent = await getBenqiSupplyApyPercent({
                    qTokenAddress,
                    underlyingTokenDecimals,
                    underlyingTotalSupply,
                    cChainClient: networkClient
                  })

                  const token = getCChainToken(
                    underlyingTokenSymbol,
                    underlyingTokenAddress
                  )

                  const marketData = {
                    marketName: MarketNames.benqi,
                    network,
                    asset: {
                      mintTokenAddress: qTokenAddress,
                      assetName: underlyingTokenName,
                      decimals: underlyingTokenDecimals,
                      iconUrl: token?.logoUri,
                      symbol: underlyingTokenSymbol,
                      contractAddress: underlyingTokenAddress,
                      mintTokenBalance: await getBenqiDepositedBalance({
                        cChainClient: networkClient,
                        underlyingTokenDecimals,
                        walletAddress: addressEVM as Address,
                        qTokenAddress
                      })
                    },
                    type: 'lending' as const,
                    supplyApyPercent,
                    historicalApyPercent: undefined,
                    totalDeposits: underlyingTotalSupply,
                    // There currently are no supply caps on Benqi markets we support.
                    supplyCapReached: false
                  }

                  return {
                    ...marketData,
                    uniqueMarketId: getUniqueMarketId(marketData)
                  }
                } catch (err) {
                  Logger.error('Error fetching/enriching Benqi market', {
                    qTokenAddress,
                    err
                  })
                  return undefined
                }
              })
            )

            return results
              .filter(promise => promise.status === 'fulfilled')
              .map(promise => promise.value)
              .filter(market => !!market)
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
