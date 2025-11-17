import {
  type QueryObserverResult,
  type RefetchOptions,
  skipToken,
  useQuery
} from '@tanstack/react-query'
import { erc20Abi, Address } from 'viem'
import { readContract } from 'viem/actions'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { findMatchingTokenWithBalance } from 'features/deposit/utils/findMatchingTokenWithBalance'
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
import { useCChainClient } from '../useCChainClient'
import { useCChainTokensWithBalance } from '../useCChainTokensWithBalance'
import { useGetCChainToken } from '../useGetCChainToken'
import { useMeritAprs } from './useMeritAprs'

export const useAaveAvailableMarkets = (): {
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
  const cChainNetwork = useCChainNetwork()
  const cChainClient = useCChainClient()
  const activeAccount = useSelector(selectActiveAccount)
  const addressEVM = activeAccount?.addressC
  const { data: meritAprs, isPending: isPendingMeritAprs } = useMeritAprs()
  const getCChainToken = useGetCChainToken()
  const { tokens } = useCChainTokensWithBalance()

  const {
    data: enrichedMarkets,
    isLoading: isLoadingEnrichedMarkets,
    isPending: isPendingEnrichedMarkets,
    isFetching: isFetchingEnrichedMarkets,
    error: errorEnrichedMarkets,
    refetch
  } = useQuery({
    queryKey: ['useAaveAvailableMarkets', cChainClient, cChainNetwork, tokens],
    queryFn:
      cChainClient && cChainNetwork && !isPendingMeritAprs
        ? async () => {
            // Step 1: Fetch all available reserve data from Aave V3 pool
            // getReservesData(in AAVE_POOL_DATA_PROVIDER abi) returns a tuple: [AggregatedReserveData[], BaseCurrencyInfo]
            // [0] = array of market data (USDC, USDT, WETH.e, etc.)
            // [1] = base currency info (USD prices, etc.) - not used currently
            const [marketsData] = await readContract(cChainClient, {
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
                const totalSupply = await readContract(cChainClient, {
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
                      chainId: cChainNetwork?.chainId,
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

                // Match with user's token balance
                const balance = findMatchingTokenWithBalance(
                  {
                    symbol: market.symbol,
                    contractAddress: market.underlyingAsset
                  },
                  tokens
                )

                // Get token metadata (logo, etc.)
                const token = getCChainToken(
                  market.symbol,
                  market.underlyingAsset
                )

                // Construct market data with all enriched information
                const marketData = {
                  marketName: MarketNames.aave,
                  network: cChainNetwork,
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
                    underlyingTokenBalance: balance,
                    mintTokenBalance: await getAaveDepositedBalance({
                      cChainClient,
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

            // Step 4: Add AVAX (native token) market data
            // Aave uses WAVAX wrapper, so we need to manually insert AVAX with user's balance
            const avaxBalance = findMatchingTokenWithBalance(
              {
                symbol: cChainNetwork.networkToken.symbol,
                contractAddress: undefined
              },
              tokens
            )

            return aaveInsertAvax(results, avaxBalance)
          }
        : skipToken
  })

  return {
    data: enrichedMarkets,
    error: errorEnrichedMarkets,
    isLoading: isLoadingEnrichedMarkets,
    isPending: isPendingEnrichedMarkets,
    isFetching: isFetchingEnrichedMarkets,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    refetch: cChainClient && !isPendingMeritAprs ? refetch : () => {}
  }
}
