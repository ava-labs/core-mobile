import {
  type QueryObserverResult,
  type RefetchOptions,
  skipToken,
  useQuery
} from '@tanstack/react-query'
import { readContract } from 'viem/actions'
import { DefiMarket, MarketNames } from 'features/deposit/types'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Address, PublicClient } from 'viem'
import { BENQI_COMPTROLLER } from 'features/deposit/abis/benqiComptroller'
import { BENQI_COMPTROLLER_C_CHAIN_ADDRESS } from 'features/deposit/consts'
import Logger from 'utils/Logger'
import { getBenqiDepositedBalance } from 'features/deposit/utils/getBenqiDepositedBalance'
import { getBenqiSupplyApyPercent } from 'features/deposit/utils/getBenqiLiveApy'
import { getBenqiUnderlyingTokenDetails } from 'features/deposit/utils/getBenqiUnderlyingTokenDetails'
import { getBenqiUnderlyingTotalSupply } from 'features/deposit//utils/getBenqiUnderlyingTotalSupply'
import { getUniqueMarketId } from 'features/deposit/utils/getUniqueMarketId'
import { findMatchingTokenWithBalance } from 'features/deposit/utils/findMatchingTokenWithBalance'
import { Network } from '@avalabs/core-chains-sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { useGetCChainToken } from '../useGetCChainToken'

export const useBenqiAvailableMarkets = ({
  network,
  networkClient,
  tokensWithBalance
}: {
  network: Network | undefined
  networkClient: PublicClient | undefined
  tokensWithBalance: LocalTokenWithBalance[]
}): {
  data: DefiMarket[] | undefined
  error: Error | null
  isLoading: boolean
  isPending: boolean
  isFetching: boolean
  refetch:
    | ((
        options?: RefetchOptions
      ) => Promise<QueryObserverResult<DefiMarket[], Error>>)
    | (() => void)
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const addressEVM = activeAccount?.addressC
  const getCChainToken = useGetCChainToken()

  const {
    data: enrichedMarkets,
    isLoading: isLoadingEnrichedMarkets,
    isPending: isPendingEnrichedMarkets,
    isFetching: isFetchingEnrichedMarkets,
    error: errorEnrichedMarkets,
    refetch
  } = useQuery({
    queryKey: [
      'useBenqiAvailableMarkets',
      networkClient,
      network,
      tokensWithBalance
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

                  const balance = findMatchingTokenWithBalance(
                    {
                      symbol: underlyingTokenSymbol,
                      contractAddress: underlyingTokenAddress
                    },
                    tokensWithBalance
                  )

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
                      underlyingTokenBalance: balance,
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
    data: enrichedMarkets,
    error: errorEnrichedMarkets ?? null,
    isLoading: isLoadingEnrichedMarkets,
    isPending: isPendingEnrichedMarkets,
    isFetching: isFetchingEnrichedMarkets,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    refetch: networkClient ? refetch : () => {}
  }
}
