import { skipToken, useQuery } from '@tanstack/react-query'
import { createPublicClient, http, Address, formatUnits } from 'viem'
import { multicall } from 'viem/actions'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { getViemChain } from 'utils/getViemChain/getViemChain'
import {
  AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS,
  AAVE_PRICE_ORACLE_SCALE,
  AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS,
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  WAD
} from '../consts'
import { AAVE_POOL_DATA_PROVIDER } from '../abis/aavePoolDataProvider'
import {
  AaveBorrowData,
  BenqiBorrowData,
  DefiMarket,
  MarketName,
  MarketNames
} from '../types'
import { useAvailableMarkets } from './useAvailableMarkets'
import { useAaveBorrowData } from './aave/useAaveBorrowData'
import { useBenqiBorrowData } from './benqi/useBenqiBorrowData'
import { useBenqiAccountSnapshot } from './benqi/useBenqiAccountSnapshot'

export type BorrowPosition = {
  market: DefiMarket
  borrowedBalance: bigint
  borrowedAmount: number
  borrowedAmountUsd: number
}

export type BorrowSummary = {
  netWorthUsd: number
  netApyPercent: number
  borrowPowerUsedPercent: number
  healthScore?: number
  healthRiskLabel?: HealthRiskLabel
}

export type HealthRiskLabel = 'low risk' | 'moderate risk' | 'high risk'

const getHealthRiskLabel = (score: number): HealthRiskLabel => {
  if (score <= 1.1) {
    return 'high risk'
  }
  if (score <= 3) {
    return 'moderate risk'
  }
  return 'low risk'
}

const getAaveDebtUsd = (aaveBorrowData: AaveBorrowData | undefined): number => {
  if (!aaveBorrowData?.totalDebtUSD) {
    return 0
  }
  return Number(
    formatUnits(aaveBorrowData.totalDebtUSD, AAVE_PRICE_ORACLE_SCALE)
  )
}

const getAaveAvailableUsd = (
  aaveBorrowData: AaveBorrowData | undefined
): number => {
  if (!aaveBorrowData?.availableBorrowsUSD) {
    return 0
  }
  return Number(
    formatUnits(aaveBorrowData.availableBorrowsUSD, AAVE_PRICE_ORACLE_SCALE)
  )
}

const getBenqiDebtUsd = (
  benqiBorrowData: BenqiBorrowData | undefined
): number => {
  if (!benqiBorrowData?.totalDebtUSD) {
    return 0
  }
  return Number(formatUnits(benqiBorrowData.totalDebtUSD, WAD))
}

const getBenqiAvailableUsd = (
  benqiBorrowData: BenqiBorrowData | undefined
): number => {
  if (!benqiBorrowData?.availableBorrowsUSD) {
    return 0
  }
  return Number(formatUnits(benqiBorrowData.availableBorrowsUSD, WAD))
}

const getAaveHealthScore = (
  aaveBorrowData: AaveBorrowData | undefined,
  aaveDebtUsd: number
): number | undefined => {
  if (!aaveBorrowData?.healthFactor || aaveDebtUsd <= 0) {
    return undefined
  }
  return Number(formatUnits(aaveBorrowData.healthFactor, WAD))
}

const getBenqiHealthScore = (
  benqiBorrowData: BenqiBorrowData | undefined,
  benqiDebtUsd: number
): number | undefined => {
  if (!benqiBorrowData || benqiDebtUsd <= 0) {
    return undefined
  }

  const totalDebtWad = benqiBorrowData.totalDebtUSD
  const liquidityWad = benqiBorrowData.liquidity
  const healthScoreWad =
    ((liquidityWad + totalDebtWad) * 10n ** BigInt(WAD)) / totalDebtWad

  return Number(formatUnits(healthScoreWad, WAD))
}

const getBorrowedBalance = (
  market: DefiMarket,
  aaveDebtMap: Map<string, bigint> | undefined,
  benqiDebtMap: Map<string, bigint>
): bigint => {
  if (market.marketName === MarketNames.aave) {
    // For native AVAX market (contractAddress is undefined), look up WAVAX debt
    const lookupAddress =
      market.asset.contractAddress ?? AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
    return aaveDebtMap?.get(lookupAddress.toLowerCase()) ?? 0n
  }

  return benqiDebtMap.get(market.asset.mintTokenAddress.toLowerCase()) ?? 0n
}

const isAaveWavaxMarket = (market: DefiMarket): boolean => {
  return (
    market.marketName === MarketNames.aave &&
    market.asset.contractAddress?.toLowerCase() ===
      AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS.toLowerCase()
  )
}

const buildBorrowPositions = ({
  markets,
  aaveDebtMap,
  benqiDebtMap
}: {
  markets: DefiMarket[]
  aaveDebtMap: Map<string, bigint> | undefined
  benqiDebtMap: Map<string, bigint>
}): BorrowPosition[] => {
  return markets.flatMap(market => {
    // Skip AAVE WAVAX market - debt is shown under AVAX market instead
    if (isAaveWavaxMarket(market)) {
      return []
    }

    const borrowedBalance = getBorrowedBalance(
      market,
      aaveDebtMap,
      benqiDebtMap
    )

    if (borrowedBalance <= 0n) {
      return []
    }

    const borrowedAmount = Number(
      formatUnits(borrowedBalance, market.asset.decimals)
    )
    const borrowedAmountUsd =
      borrowedAmount * market.asset.mintTokenBalance.price.value.toNumber()

    return [{ market, borrowedBalance, borrowedAmount, borrowedAmountUsd }]
  })
}

const reconcileBorrowPositionsUsd = ({
  positions,
  aaveBorrowData,
  benqiBorrowData
}: {
  positions: BorrowPosition[]
  aaveBorrowData: AaveBorrowData | undefined
  benqiBorrowData: BenqiBorrowData | undefined
}): BorrowPosition[] => {
  const targetDebtByProtocol: Record<MarketName, number> = {
    [MarketNames.aave]: getAaveDebtUsd(aaveBorrowData),
    [MarketNames.benqi]: getBenqiDebtUsd(benqiBorrowData)
  }
  const currentDebtByProtocol: Record<MarketName, number> = {
    [MarketNames.aave]: 0,
    [MarketNames.benqi]: 0
  }

  for (const position of positions) {
    currentDebtByProtocol[position.market.marketName] +=
      position.borrowedAmountUsd
  }

  return positions.map(position => {
    const protocol = position.market.marketName
    const targetDebtUsd = targetDebtByProtocol[protocol]
    const protocolBorrowUsd = currentDebtByProtocol[protocol]

    if (targetDebtUsd <= 0 || protocolBorrowUsd <= 0) {
      return position
    }

    const scale = targetDebtUsd / protocolBorrowUsd

    return {
      ...position,
      borrowedAmountUsd: position.borrowedAmountUsd * scale
    }
  })
}

const filterPositionsByProtocol = ({
  positions,
  protocol
}: {
  positions: BorrowPosition[]
  protocol?: MarketName
}): BorrowPosition[] => {
  if (!protocol) {
    return positions
  }

  return positions.filter(position => position.market.marketName === protocol)
}

const filterMarketsByProtocol = ({
  markets,
  protocol
}: {
  markets: DefiMarket[]
  protocol?: MarketName
}): DefiMarket[] => {
  if (!protocol) {
    return markets
  }

  return markets.filter(market => market.marketName === protocol)
}

const getScopedBorrowData = ({
  protocol,
  aaveBorrowData,
  benqiBorrowData
}: {
  protocol?: MarketName
  aaveBorrowData: AaveBorrowData | undefined
  benqiBorrowData: BenqiBorrowData | undefined
}): {
  scopedAaveBorrowData: AaveBorrowData | undefined
  scopedBenqiBorrowData: BenqiBorrowData | undefined
} => {
  return {
    scopedAaveBorrowData:
      protocol === MarketNames.benqi ? undefined : aaveBorrowData,
    scopedBenqiBorrowData:
      protocol === MarketNames.aave ? undefined : benqiBorrowData
  }
}

const computeBorrowSummary = ({
  markets,
  positions,
  aaveBorrowData,
  benqiBorrowData
}: {
  markets: DefiMarket[]
  positions: BorrowPosition[]
  aaveBorrowData: AaveBorrowData | undefined
  benqiBorrowData: BenqiBorrowData | undefined
}): BorrowSummary => {
  const totalDepositsUsd = markets.reduce(
    (sum, market) =>
      sum + market.asset.mintTokenBalance.balanceValue.value.toNumber(),
    0
  )
  const totalBorrowUsd = positions.reduce(
    (sum, position) => sum + position.borrowedAmountUsd,
    0
  )

  const totalSupplyIncomeUsd = markets.reduce(
    (sum, market) =>
      sum +
      (market.asset.mintTokenBalance.balanceValue.value.toNumber() *
        market.supplyApyPercent) /
        100,
    0
  )
  const totalBorrowCostUsd = positions.reduce(
    (sum, position) =>
      sum +
      (position.borrowedAmountUsd * position.market.borrowApyPercent) / 100,
    0
  )
  const netWorthUsd = totalDepositsUsd - totalBorrowUsd

  const netApyPercent =
    netWorthUsd > 0
      ? ((totalSupplyIncomeUsd - totalBorrowCostUsd) / netWorthUsd) * 100
      : 0

  const aaveDebtUsd = getAaveDebtUsd(aaveBorrowData)
  const aaveAvailableUsd = getAaveAvailableUsd(aaveBorrowData)
  const benqiDebtUsd = getBenqiDebtUsd(benqiBorrowData)
  const benqiAvailableUsd = getBenqiAvailableUsd(benqiBorrowData)
  const totalCapacityUsd =
    aaveDebtUsd + aaveAvailableUsd + benqiDebtUsd + benqiAvailableUsd

  const borrowPowerUsedPercent =
    totalCapacityUsd > 0
      ? ((aaveDebtUsd + benqiDebtUsd) / totalCapacityUsd) * 100
      : 0

  const healthScores = [
    getAaveHealthScore(aaveBorrowData, aaveDebtUsd),
    getBenqiHealthScore(benqiBorrowData, benqiDebtUsd)
  ].filter((value): value is number => value !== undefined)

  const healthScore =
    healthScores.length > 0 ? Math.min(...healthScores) : undefined

  return {
    netWorthUsd,
    netApyPercent,
    borrowPowerUsedPercent,
    healthScore,
    healthRiskLabel:
      healthScore !== undefined ? getHealthRiskLabel(healthScore) : undefined
  }
}

const getBorrowSummary = ({
  markets,
  positions,
  aaveBorrowData,
  benqiBorrowData
}: {
  markets: DefiMarket[]
  positions: BorrowPosition[]
  aaveBorrowData: AaveBorrowData | undefined
  benqiBorrowData: BenqiBorrowData | undefined
}): BorrowSummary | undefined => {
  if (positions.length === 0) {
    return undefined
  }

  return computeBorrowSummary({
    markets,
    positions,
    aaveBorrowData,
    benqiBorrowData
  })
}

export const useBorrowPositionsSummary = ({
  protocol
}: {
  protocol?: MarketName
} = {}): {
  positions: BorrowPosition[]
  summary: BorrowSummary | undefined
  isLoading: boolean
  isFetching: boolean
  isRefreshing: boolean
  refresh: () => void
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const userAddress = activeAccount?.addressC as Address | undefined
  const cChainNetwork = useCChainNetwork()
  const {
    data: markets,
    isLoading,
    isFetching,
    refresh,
    isRefreshing
  } = useAvailableMarkets()
  const { data: aaveBorrowData, isLoading: isLoadingAaveBorrowData } =
    useAaveBorrowData()
  const { data: benqiBorrowData, isLoading: isLoadingBenqiBorrowData } =
    useBenqiBorrowData()

  const networkClient = useMemo(() => {
    if (!cChainNetwork) {
      return undefined
    }
    const cChain = getViemChain(cChainNetwork)
    return createPublicClient({ chain: cChain, transport: http() })
  }, [cChainNetwork])

  const { data: benqiAccountSnapshot, isLoading: isLoadingBenqiSnapshot } =
    useBenqiAccountSnapshot({ networkClient })

  const { data: aaveDebtMap, isLoading: isLoadingAaveDebtMap } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ReactQueryKeys.AAVE_USER_RESERVES_DATA,
      userAddress,
      networkClient?.chain.id
    ],
    queryFn:
      networkClient && userAddress
        ? async () => {
            const [userReservesRaw] = await multicall(networkClient, {
              contracts: [
                {
                  address: AAVE_UI_POOL_DATA_PROVIDER_C_CHAIN_ADDRESS,
                  abi: AAVE_POOL_DATA_PROVIDER,
                  functionName: 'getUserReservesData',
                  args: [
                    AAVE_POOL_ADDRESSES_PROVIDER_C_CHAIN_ADDRESS,
                    userAddress
                  ]
                }
              ]
            })

            const reserves = userReservesRaw.result?.[0] ?? []
            const map = new Map<string, bigint>()
            for (const reserve of reserves) {
              map.set(
                reserve.underlyingAsset.toLowerCase(),
                reserve.scaledVariableDebt
              )
            }

            return map
          }
        : skipToken,
    staleTime: 30 * 1000
  })

  const benqiDebtMap = useMemo(() => {
    const map = new Map<string, bigint>()
    for (const snapshot of benqiAccountSnapshot?.accountMarketSnapshots ?? []) {
      map.set(snapshot.market.toLowerCase(), snapshot.borrowBalance)
    }
    return map
  }, [benqiAccountSnapshot])

  const allPositions = useMemo(() => {
    return buildBorrowPositions({
      markets: markets ?? [],
      aaveDebtMap,
      benqiDebtMap
    })
  }, [markets, aaveDebtMap, benqiDebtMap])

  const reconciledPositions = useMemo(() => {
    return reconcileBorrowPositionsUsd({
      positions: allPositions,
      aaveBorrowData,
      benqiBorrowData
    })
  }, [allPositions, aaveBorrowData, benqiBorrowData])

  const positions = useMemo(() => {
    return filterPositionsByProtocol({
      positions: reconciledPositions,
      protocol
    })
  }, [reconciledPositions, protocol])

  const filteredMarkets = useMemo(() => {
    return filterMarketsByProtocol({ markets: markets ?? [], protocol })
  }, [markets, protocol])

  const { scopedAaveBorrowData, scopedBenqiBorrowData } = useMemo(() => {
    return getScopedBorrowData({
      protocol,
      aaveBorrowData,
      benqiBorrowData
    })
  }, [protocol, aaveBorrowData, benqiBorrowData])

  const summary = useMemo<BorrowSummary | undefined>(() => {
    return getBorrowSummary({
      markets: filteredMarkets,
      positions,
      aaveBorrowData: scopedAaveBorrowData,
      benqiBorrowData: scopedBenqiBorrowData
    })
  }, [filteredMarkets, positions, scopedAaveBorrowData, scopedBenqiBorrowData])

  return {
    positions,
    summary,
    isLoading:
      isLoading ||
      isLoadingAaveDebtMap ||
      isLoadingBenqiSnapshot ||
      isLoadingAaveBorrowData ||
      isLoadingBenqiBorrowData,
    isFetching,
    isRefreshing,
    refresh
  }
}
