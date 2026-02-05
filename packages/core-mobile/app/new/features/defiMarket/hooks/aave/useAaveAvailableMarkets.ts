import { QueryObserverResult, skipToken, useQuery } from '@tanstack/react-query'
import { erc20Abi, Address, PublicClient } from 'viem'
import { readContract } from 'viem/actions'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { type DefiMarket, MarketNames } from '../../types'
import {
  AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS,
  AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS
} from '../../consts'
import { AAVE_POOL_DATA_PROVIDER } from '../../abis/aavePoolDataProvider'
import { aaveInsertAvax } from '../../utils/aaveInsertAvax'
import { getAaveFilteredMarketData } from '../../utils/getAaveFilteredMarketData'
import {
  formatAaveInterest,
  formatAaveSupplyApy,
  formatAmount
} from '../../utils/formatInterest'
import { getAaveDepositedBalance } from '../../utils/getAaveDepositedBalance'
import { getUniqueMarketId } from '../../utils/getUniqueMarketId'
import { bigIntToBig } from '../../utils/bigInt'
import {
  fetchAaveApyHistory,
  parseAaveApyHistory
} from '../../utils/fetchAaveApyHistory'
import { getMeritAprBonus } from '../../utils/getMeritAprBonus'
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
              filteredMarkets.map(async market => {
                const decimals = bigIntToBig(market.decimals).toNumber()

                // Calculate current APYs
                const supplyApyPercent = formatAaveSupplyApy(
                  formatAaveInterest(bigIntToBig(market.liquidityRate))
                )
                const borrowApyPercent = formatAaveSupplyApy(
                  formatAaveInterest(bigIntToBig(market.variableBorrowRate))
                )

                // Fetch total supply and historical APY data in parallel
                const [totalSupply, apyHistory] = await Promise.all([
                  readContract(networkClient, {
                    address: market.mintTokenAddress,
                    abi: erc20Abi,
                    functionName: 'totalSupply'
                  }),
                  fetchAaveApyHistory(network, market.underlyingAsset)
                ])

                const formattedTotalDeposits = formatAmount(
                  bigIntToBig(totalSupply),
                  decimals
                )
                const supplyCapReached = formattedTotalDeposits.gte(
                  bigIntToBig(market.supplyCap)
                )

                const { historicalApyPercent, historicalBorrowApyPercent } =
                  parseAaveApyHistory(apyHistory.supply, apyHistory.borrow)

                const meritAprBonus = getMeritAprBonus(market.symbol, meritAprs)
                const token = getCChainToken(
                  market.symbol,
                  market.underlyingAsset
                )

                const depositedBalanceResult = await getAaveDepositedBalance({
                  cChainClient: networkClient,
                  walletAddress: addressEVM as Address,
                  underlyingTokenDecimals: decimals,
                  underlyingAssetAddress: market.underlyingAsset
                })

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
                    mintTokenBalance: depositedBalanceResult
                  },
                  supplyApyPercent: supplyApyPercent + meritAprBonus,
                  historicalApyPercent,
                  borrowApyPercent,
                  historicalBorrowApyPercent,
                  borrowingEnabled: market.borrowingEnabled,
                  canBeUsedAsCollateral: market.usageAsCollateralEnabled
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
    data,
    error,
    isLoading,
    isPending,
    isFetching,
    refetch
  }
}
