import { Network } from '@avalabs/core-chains-sdk'
import { Money as BaseMoney } from '@avalabs/glacier-sdk'
import { Address } from 'viem'

export type Money = Omit<BaseMoney, 'value'> & {
  value: Big
  valueString: string
}

export type DefiAssetBalance = {
  readonly balance: bigint
  readonly balanceValue: Money
  readonly price: Money
}

export type DefiAssetDetails = {
  readonly mintTokenAddress: Address
  readonly assetName: string
  readonly decimals: number
  readonly iconUrl: string | undefined
  readonly symbol: string
  readonly contractAddress: Address | undefined
  readonly mintTokenBalance: DefiAssetBalance
}

// TODO: Check with Aave and BENQI contracts to see if this typing has value.
type DefiMarketType = 'lending' | 'rebalancing'

export enum MarketNames {
  aave = 'aave',
  benqi = 'benqi'
}

export type MarketName = MarketNames.aave | MarketNames.benqi

export type DefiMarket = {
  readonly marketName: MarketName
  readonly network: Network
  readonly asset: DefiAssetDetails
  readonly type: DefiMarketType
  readonly supplyApyPercent: number
  // Based on 30-day historical - this data may not be available.
  readonly historicalApyPercent: number | undefined
  readonly supplyCapReached: boolean
  // Total deposits for this market globally - not based on current wallet.
  readonly totalDeposits: Big | undefined
  readonly uniqueMarketId: string
}

export type AaveReserveData = {
  readonly underlyingAsset: Address
  readonly name: string
  readonly symbol: string
  readonly decimals: bigint
  readonly baseLTVasCollateral: bigint
  readonly reserveLiquidationThreshold: bigint
  readonly reserveLiquidationBonus: bigint
  readonly reserveFactor: bigint
  readonly usageAsCollateralEnabled: boolean
  readonly borrowingEnabled: boolean
  readonly isActive: boolean
  readonly isPaused: boolean
  readonly isFrozen: boolean
  readonly liquidityIndex: bigint
  readonly variableBorrowIndex: bigint
  readonly liquidityRate: bigint
  readonly variableBorrowRate: bigint
  readonly lastUpdateTimestamp: number
  readonly mintTokenAddress: Address
  readonly variableDebtTokenAddress: Address
  readonly interestRateStrategyAddress: Address
  readonly availableLiquidity: bigint
  readonly totalScaledVariableDebt: bigint
  readonly priceInMarketReferenceCurrency: bigint
  readonly priceOracle: string
  readonly variableRateSlope1: bigint
  readonly variableRateSlope2: bigint
  readonly baseVariableBorrowRate: bigint
  readonly optimalUsageRatio: bigint
  readonly isSiloedBorrowing: boolean
  readonly accruedToTreasury: bigint
  readonly unbacked: bigint
  readonly isolationModeTotalDebt: bigint
  readonly flashLoanEnabled: boolean
  readonly debtCeiling: bigint
  readonly debtCeilingDecimals: bigint
  readonly borrowCap: bigint
  readonly supplyCap: bigint
  readonly borrowableInIsolation: boolean
  readonly virtualAccActive: boolean
  readonly virtualUnderlyingBalance: bigint
}
