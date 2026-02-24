import { formatUnits } from 'viem'
import { WAD } from '../consts'
import {
  BenqiBorrowData,
  BorrowPosition,
  BorrowSummary,
  DefiMarket
} from '../types'

const getBenqiDebtUsd = (benqiBorrowData: BenqiBorrowData): number => {
  return Number(formatUnits(benqiBorrowData.totalDebtUSD, WAD))
}

const getBenqiAvailableUsd = (benqiBorrowData: BenqiBorrowData): number => {
  return Number(formatUnits(benqiBorrowData.availableBorrowsUSD, WAD))
}

const getBenqiHealthScore = (
  benqiBorrowData: BenqiBorrowData,
  benqiDebtUsd: number
): number | undefined => {
  if (benqiDebtUsd <= 0) {
    return undefined
  }

  const totalDebtWad = benqiBorrowData.totalDebtUSD
  const liquidityWad = benqiBorrowData.liquidity
  const healthScoreWad =
    ((liquidityWad + totalDebtWad) * 10n ** BigInt(WAD)) / totalDebtWad

  return Number(formatUnits(healthScoreWad, WAD))
}

export const buildBenqiBorrowPositions = ({
  markets,
  benqiDebtMap
}: {
  markets: DefiMarket[]
  benqiDebtMap: Map<string, bigint>
}): BorrowPosition[] => {
  return markets.flatMap(market => {
    const borrowedBalance =
      benqiDebtMap.get(market.asset.mintTokenAddress.toLowerCase()) ?? 0n

    if (borrowedBalance <= 0n) {
      return []
    }

    const borrowedAmount = Number(
      formatUnits(borrowedBalance, market.asset.decimals)
    )

    return [
      {
        market,
        borrowedBalance,
        borrowedAmount,
        borrowedAmountUsd:
          borrowedAmount * market.asset.mintTokenBalance.price.value.toNumber()
      }
    ]
  })
}

export const getBenqiBorrowSummary = ({
  markets,
  positions,
  benqiBorrowData
}: {
  markets: DefiMarket[]
  positions: BorrowPosition[]
  benqiBorrowData: BenqiBorrowData
}): BorrowSummary | undefined => {
  if (positions.length === 0) {
    return undefined
  }

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
    totalDepositsUsd > 0
      ? ((totalSupplyIncomeUsd - totalBorrowCostUsd) / totalDepositsUsd) * 100
      : 0

  const benqiDebtUsd = getBenqiDebtUsd(benqiBorrowData)
  const benqiAvailableUsd = getBenqiAvailableUsd(benqiBorrowData)
  const totalCapacityUsd = benqiDebtUsd + benqiAvailableUsd
  const borrowPowerUsedPercent =
    totalCapacityUsd > 0 ? (benqiDebtUsd / totalCapacityUsd) * 100 : 0

  const healthScore = getBenqiHealthScore(benqiBorrowData, benqiDebtUsd)

  return {
    netWorthUsd,
    netApyPercent,
    borrowPowerUsedPercent,
    healthScore
  }
}
