import { QueryObserverResult, skipToken, useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { multicall } from 'viem/actions'
import { Address, PublicClient, zeroAddress } from 'viem'
import { Network } from '@avalabs/core-chains-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'
import { DefiMarket, MarketNames } from 'features/defiMarket/types'
import { getBenqiDepositedBalance } from 'features/defiMarket/utils/getBenqiDepositedBalance'
import { getBenqiBorrowApyPercent } from 'features/defiMarket/utils/getBenqiBorrowApyPercent'
import { getBenqiSupplyApyPercent } from 'features/defiMarket/utils/getBenqiSupplyApyPercent'
import { getUniqueMarketId } from 'features/defiMarket/utils/getUniqueMarketId'
import { BENQI_LENS_ABI } from 'features/defiMarket/abis/benqiLens'
import { BENQI_PRICE_ORACLE } from 'features/defiMarket/abis/benqiPriceOracle'
import {
  BENQI_LENS_C_CHAIN_ADDRESS,
  BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
  BENQI_QAVAX_C_CHAIN_ADDRESS,
  BENQI_QI_C_CHAIN_ADDRESS
} from 'features/defiMarket/consts'
import { formatAmount } from 'features/defiMarket/utils/formatInterest'
import { bigIntToBig } from 'features/defiMarket/utils/bigInt'
import { useGetCChainToken } from '../useGetCChainToken'
import { useBenqiAccountSnapshot } from './useBenqiAccountSnapshot'

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
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const getCChainToken = useGetCChainToken()
  const {
    data: accountSnapshot,
    isLoading: isLoadingAccountSnapshot,
    refetch: refetchAccountSnapshot
  } = useBenqiAccountSnapshot({ networkClient })

  const shouldFetch = networkClient && network && !isLoadingAccountSnapshot

  // Extract primitive key from accountSnapshot for queryKey
  // Sum of all supplyBalances changes when any balance changes
  const snapshotKey = accountSnapshot?.accountMarketSnapshots
    .reduce((sum, s) => sum + s.supplyBalance, 0n)
    .toString()

  const {
    data,
    isLoading,
    isPending,
    isFetching,
    error,
    refetch: refetchMarkets
  } = useQuery({
    queryKey: [
      ReactQueryKeys.BENQI_AVAILABLE_MARKETS,
      networkClient?.chain?.id,
      snapshotKey
    ],
    queryFn: shouldFetch
      ? async () => {
          try {
            // Fetch all market metadata and prices in a single multicall
            const [marketsRaw, qiPriceRaw, avaxPriceRaw] = await multicall(
              networkClient,
              {
                contracts: [
                  {
                    address: BENQI_LENS_C_CHAIN_ADDRESS,
                    functionName: 'getMarketMetadataForAllMarkets',
                    abi: BENQI_LENS_ABI,
                    args: []
                  },
                  // QI price: getUnderlyingPrice(QI token address), scaled by 1e18 (WAD)
                  {
                    address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
                    abi: BENQI_PRICE_ORACLE,
                    functionName: 'getUnderlyingPrice',
                    args: [BENQI_QI_C_CHAIN_ADDRESS]
                  },
                  // AVAX price: getUnderlyingPrice(qAVAX address), scaled by 1e18 (WAD)
                  {
                    address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
                    abi: BENQI_PRICE_ORACLE,
                    functionName: 'getUnderlyingPrice',
                    args: [BENQI_QAVAX_C_CHAIN_ADDRESS]
                  }
                ]
              }
            )

            const markets = marketsRaw.result ?? []
            const qiPrice = qiPriceRaw.result ?? 0n
            const avaxPrice = avaxPriceRaw.result ?? 0n

            return markets
              .map(rawBenqiMarket => {
                try {
                  const {
                    mintPaused: isPaused,
                    borrowPaused,
                    underlying,
                    totalUnderlyingSupply,
                    totalBorrows,
                    qiSupplyRewardSpeed,
                    avaxSupplyRewardSpeed,
                    qiBorrowRewardSpeed,
                    avaxBorrowRewardSpeed,
                    price,
                    supplyRate,
                    borrowRate,
                    market: qTokenAddress,
                    collateralFactor
                  } = rawBenqiMarket

                  // We don't currently show paused markets
                  if (isPaused) {
                    return undefined
                  }

                  const underlyingTokenDecimals = Number(underlying.decimals)
                  const formattedUnderlyingTotalSupply = formatAmount(
                    bigIntToBig(totalUnderlyingSupply),
                    underlyingTokenDecimals
                  )
                  const formattedUnderlyingPrice = formatAmount(
                    bigIntToBig(price),
                    36 - underlyingTokenDecimals
                  )

                  const supplyApyPercent = getBenqiSupplyApyPercent({
                    qiSupplyRewardSpeed,
                    avaxSupplyRewardSpeed,
                    avaxPrice,
                    qiPrice,
                    formattedUnderlyingTotalSupply,
                    formattedUnderlyingPrice,
                    supplyRate
                  })

                  const formattedTotalBorrows = formatAmount(
                    bigIntToBig(totalBorrows),
                    underlyingTokenDecimals
                  )

                  const borrowApyPercent = getBenqiBorrowApyPercent({
                    qiBorrowRewardSpeed,
                    avaxBorrowRewardSpeed,
                    avaxPrice,
                    qiPrice,
                    formattedTotalBorrows,
                    formattedUnderlyingPrice,
                    borrowRate
                  })

                  const token = getCChainToken(
                    underlying.symbol,
                    underlying.token
                  )

                  // Get balance from account snapshot if available
                  const maybeSnapshot =
                    accountSnapshot?.accountMarketSnapshots.find(
                      snapshot => snapshot.market === qTokenAddress
                    )
                  const snapshotBalance = maybeSnapshot
                    ? maybeSnapshot.supplyBalance
                    : 0n

                  // Zero address means native token (AVAX), not an ERC20 contract
                  const contractAddress =
                    underlying.token === zeroAddress
                      ? undefined
                      : underlying.token

                  const marketData: Omit<DefiMarket, 'uniqueMarketId'> = {
                    marketName: MarketNames.benqi,
                    network,
                    asset: {
                      mintTokenAddress: qTokenAddress as Address,
                      assetName: underlying.name,
                      decimals: underlyingTokenDecimals,
                      iconUrl: token?.logoUri,
                      symbol: underlying.symbol,
                      contractAddress,
                      mintTokenBalance: getBenqiDepositedBalance({
                        balanceOfUnderlying: snapshotBalance,
                        underlyingTokenDecimals,
                        formattedUnderlyingPrice
                      })
                    },
                    type: 'lending',
                    supplyApyPercent,
                    historicalApyPercent: undefined,
                    borrowApyPercent,
                    historicalBorrowApyPercent: undefined,
                    borrowingEnabled: !borrowPaused,
                    totalDeposits: formattedUnderlyingTotalSupply,
                    // There currently are no supply caps on Benqi markets we support.
                    supplyCapReached: false,
                    // collateralFactor > 0 means the asset can be used as collateral
                    canBeUsedAsCollateral: collateralFactor > 0n
                  }

                  const market: DefiMarket = {
                    ...marketData,
                    uniqueMarketId: getUniqueMarketId(marketData)
                  }

                  return market
                } catch (err) {
                  Logger.error('Error enriching Benqi market', {
                    qTokenAddress: rawBenqiMarket.market,
                    err
                  })
                  return undefined
                }
              })
              .filter((market): market is DefiMarket => market !== undefined)
          } catch (err) {
            Logger.error('Error fetching Benqi markets from Lens contract', {
              err
            })
            throw err
          }
        }
      : skipToken
  })

  const refetch = useCallback(async () => {
    await refetchAccountSnapshot()
    return refetchMarkets()
  }, [refetchAccountSnapshot, refetchMarkets])

  return {
    data,
    error,
    isLoading: isLoading || isLoadingAccountSnapshot,
    isPending,
    isFetching,
    refetch
  }
}
