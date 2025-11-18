import { skipToken, useQuery } from '@tanstack/react-query'
import { erc20Abi, Address, PublicClient } from 'viem'
import { readContract } from 'viem/actions'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { type DefiMarket, MarketNames } from '../../types'
import { gqlQuery } from '../../utils/gqlQuery'
import {
  AAVE_V3_GQL_API_URL,
  AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS,
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS
} from '../../consts'
import { AAVE_POOL_DATA_PROVIDER } from '../../abis/aavePoolDataProvider'
import { supplyApyHistorySchema } from '../../schema'
import { aaveInsertAvax } from '../../utils/aaveInsertAvax'
import {
  formatAaveInterest,
  formatAaveSupplyApy,
  formatAmount
} from '../../utils/formatInterest'
import { getAaveDepositedBalance } from '../../utils/getAaveDepositedBalance'
import { getAaveFilteredMarketData } from '../../utils/getAaveFilteredMarketData'
import { getUniqueMarketId } from '../../utils/getUniqueMarketId'
import { isMeritSupplyKey } from '../../utils/isMeritSupplyKey'
import { bigIntToBig } from '../../utils/bigInt'
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
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const addressEVM = activeAccount?.addressC
  const { data: meritAprs, isPending: isPendingMeritAprs } = useMeritAprs()
  const getCChainToken = useGetCChainToken()

  const {
    data: enrichedMarkets,
    isLoading: isLoadingEnrichedMarkets,
    isPending: isPendingEnrichedMarkets,
    isFetching: isFetchingEnrichedMarkets,
    error: errorEnrichedMarkets
  } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ReactQueryKeys.AAVE_AVAILABLE_MARKETS, networkClient?.chain?.id],
    queryFn:
      networkClient && network && !isPendingMeritAprs
        ? async () => {
            // Step 1: Fetch all available reserve data from Aave V3 pool
            // getReservesData(in AAVE_POOL_DATA_PROVIDER abi) returns a tuple: [AggregatedReserveData[], BaseCurrencyInfo]
            // [0] = array of market data (USDC, USDT, WETH.e, etc.)
            // [1] = base currency info (USD prices, etc.) - not used currently
            const [marketsData] = await readContract(networkClient, {
              address: AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS,
              abi: AAVE_POOL_DATA_PROVIDER,
              functionName: 'getReservesData',
              args: [AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS]
            })

            // Step 2: Filter out inactive, paused, or frozen markets
            const filteredMarkets = getAaveFilteredMarketData(marketsData)

            // Step 3: Enrich each market with additional data (APY, balances, historical data)
            const results = await Promise.all(
              filteredMarkets.map(async market => {
                const decimals = bigIntToBig(market.decimals).toNumber()

                // Calculate current APY from on-chain liquidity rate
                const liveAprPercent = formatAaveInterest(
                  bigIntToBig(market.liquidityRate)
                )
                const supplyApyPercent = formatAaveSupplyApy(liveAprPercent)

                // Get total supply to calculate total deposits
                const totalSupply = await readContract(networkClient, {
                  address: market.mintTokenAddress,
                  abi: erc20Abi,
                  functionName: 'totalSupply'
                })

                const formattedTotalDeposits = formatAmount(
                  bigIntToBig(totalSupply),
                  decimals
                )
                const supplyCapReached = formattedTotalDeposits.gte(
                  bigIntToBig(market.supplyCap)
                )

                // Fetch historical APY data (30-day average) from Aave GraphQL API
                const supplyApyHistoryResponse = await gqlQuery(
                  AAVE_V3_GQL_API_URL,
                  `
                  query supplyAPYHistory($request: SupplyAPYHistoryRequest!) {
                    supplyAPYHistory(request: $request) {
                      avgRate {
                        formatted
                      }
                    }
                  }
                  `,
                  {
                    request: {
                      chainId: network.chainId,
                      market: AAVE_POOL_C_CHAIN_ADDRESS,
                      underlyingToken: market.underlyingAsset,
                      window: 'LAST_MONTH'
                    }
                  }
                )

                // Add Merit protocol rewards if available for this asset
                const formattedSymbol = market.symbol
                  .replace(/[^a-zA-Z0-9]/g, '')
                  .toLowerCase()
                const maybeMeritSupplyKey = `avalanche-supply-${formattedSymbol}`
                const maybeMeritApr = isMeritSupplyKey(maybeMeritSupplyKey)
                  ? meritAprs?.[maybeMeritSupplyKey]
                  : 0
                const guaranteedMeritApr = maybeMeritApr ?? 0

                // Parse and calculate average historical APY
                const supplyApyHistory = supplyApyHistorySchema.safeParse(
                  supplyApyHistoryResponse
                )
                const safeData = supplyApyHistory.success
                  ? supplyApyHistory.data.data.supplyAPYHistory
                  : []

                const historicalApyPercent =
                  safeData.reduce((accumulator, current) => {
                    const formattedNumber = Number.parseFloat(
                      current.avgRate.formatted
                    )
                    return accumulator + formattedNumber
                  }, 0) / safeData.length

                // Get token metadata (logo, etc.)
                const token = getCChainToken(
                  market.symbol,
                  market.underlyingAsset
                )

                // Construct market data with all enriched information
                const marketData = {
                  marketName: MarketNames.aave,
                  network,
                  type: 'lending' as const,
                  supplyCapReached,
                  totalDeposits: formatAmount(
                    bigIntToBig(totalSupply),
                    decimals
                  ),
                  asset: {
                    mintTokenAddress: market.mintTokenAddress,
                    assetName: market.name,
                    decimals,
                    iconUrl: token?.logoUri,
                    symbol: market.symbol,
                    contractAddress: market.underlyingAsset,
                    mintTokenBalance: await getAaveDepositedBalance({
                      cChainClient: networkClient,
                      walletAddress: addressEVM as Address,
                      underlyingTokenDecimals: decimals,
                      underlyingAssetAddress: market.underlyingAsset
                    })
                  },
                  supplyApyPercent: supplyApyPercent + guaranteedMeritApr, // Base APY + Merit rewards
                  historicalApyPercent
                }

                return {
                  ...marketData,
                  uniqueMarketId: getUniqueMarketId(marketData)
                }
              })
            )

            return aaveInsertAvax(results)
          }
        : skipToken
  })

  return {
    data: enrichedMarkets,
    error: errorEnrichedMarkets,
    isLoading: isLoadingEnrichedMarkets,
    isPending: isPendingEnrichedMarkets,
    isFetching: isFetchingEnrichedMarkets
  }
}
