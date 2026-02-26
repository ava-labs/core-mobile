import { formatUnits } from 'viem'
import {
  AAVE_PRICE_ORACLE_SCALE,
  AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS,
  WAD
} from '../consts'
import {
  AaveBorrowData,
  BorrowPosition,
  BorrowSummary,
  DefiMarket,
  MarketNames
} from '../types'
import { calculateNetApy } from './calculateNetApy'

const getAaveDebtUsd = (aaveBorrowData: AaveBorrowData): number => {
  return Number(
    formatUnits(aaveBorrowData.totalDebtUSD, AAVE_PRICE_ORACLE_SCALE)
  )
}

const getAaveAvailableUsd = (aaveBorrowData: AaveBorrowData): number => {
  return Number(
    formatUnits(aaveBorrowData.availableBorrowsUSD, AAVE_PRICE_ORACLE_SCALE)
  )
}

const getAaveHealthScore = (
  aaveBorrowData: AaveBorrowData,
  aaveDebtUsd: number
): number | undefined => {
  if (aaveDebtUsd <= 0) {
    return undefined
  }

  return Number(formatUnits(aaveBorrowData.healthFactor, WAD))
}

const isAaveWavaxMarket = (market: DefiMarket): boolean => {
  return (
    market.marketName === MarketNames.aave &&
    market.asset.contractAddress?.toLowerCase() ===
      AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS.toLowerCase()
  )
}

export const buildAaveBorrowPositions = ({
  markets,
  aaveDebtMap
}: {
  markets: DefiMarket[]
  aaveDebtMap: Map<string, bigint> | undefined
}): BorrowPosition[] => {
  return markets.flatMap(market => {
    // Skip AAVE WAVAX market - debt is shown under AVAX market instead.
    if (isAaveWavaxMarket(market)) {
      return []
    }

    const lookupAddress =
      market.asset.contractAddress ?? AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
    const borrowedBalance = aaveDebtMap?.get(lookupAddress.toLowerCase()) ?? 0n

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

export const getAaveBorrowSummary = ({
  markets,
  positions,
  aaveBorrowData
}: {
  markets: DefiMarket[]
  positions: BorrowPosition[]
  aaveBorrowData: AaveBorrowData
}): BorrowSummary | undefined => {
  if (positions.length === 0) {
    return undefined
  }

  const deposits = markets.map(market => ({
    valueUsd: market.asset.mintTokenBalance.balanceValue.value.toNumber(),
    apyPercent: market.supplyApyPercent
  }))

  const borrows = positions.map(position => ({
    valueUsd: position.borrowedAmountUsd,
    apyPercent: position.market.borrowApyPercent
  }))

  const totalDepositsUsd = deposits.reduce((sum, d) => sum + d.valueUsd, 0)
  const totalBorrowUsd = borrows.reduce((sum, b) => sum + b.valueUsd, 0)
  const netWorthUsd = totalDepositsUsd - totalBorrowUsd
  const netApyPercent =
    calculateNetApy({ deposits, borrows, protocol: MarketNames.aave }) ?? 0

  const aaveDebtUsd = getAaveDebtUsd(aaveBorrowData)
  const aaveAvailableUsd = getAaveAvailableUsd(aaveBorrowData)
  const totalCapacityUsd = aaveDebtUsd + aaveAvailableUsd
  const borrowPowerUsedPercent =
    totalCapacityUsd > 0 ? (aaveDebtUsd / totalCapacityUsd) * 100 : 0

  const healthScore = getAaveHealthScore(aaveBorrowData, aaveDebtUsd)

  return {
    netWorthUsd,
    netApyPercent,
    borrowPowerUsedPercent,
    healthScore
  }
}
