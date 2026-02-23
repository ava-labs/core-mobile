import { Network } from '@avalabs/core-chains-sdk'
import { Money as BaseMoney } from '@avalabs/glacier-sdk'
import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
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
  // Borrow APY for this market
  readonly borrowApyPercent: number
  // Historical borrow APY (30-day average) - this data may not be available.
  readonly historicalBorrowApyPercent: number | undefined
  // Whether borrowing is enabled for this market
  readonly borrowingEnabled: boolean
  readonly supplyCapReached: boolean
  // Total deposits for this market globally - not based on current wallet.
  readonly totalDeposits: Big | undefined
  readonly uniqueMarketId: string
  // Reserve-level setting: whether this asset CAN be used as collateral
  readonly canBeUsedAsCollateral: boolean
  // User-level setting: whether the user has enabled this asset as collateral
  // Only available for AAVE markets (for now)
  readonly usageAsCollateralEnabledOnUser: boolean | undefined
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

export type DepositAsset = {
  token: LocalTokenWithBalance & { type: TokenType.ERC20 | TokenType.NATIVE }
  nativeToken: (LocalTokenWithBalance & { type: TokenType.NATIVE }) | undefined
}

// Common fields for borrow data
interface BaseBorrowData {
  availableBorrowsUSD: bigint
  tokenPriceUSD: bigint
  totalDebtUSD: bigint
}

// AAVE-specific borrow data
export interface AaveBorrowData extends BaseBorrowData {
  healthFactor: bigint
  totalCollateralUSD: bigint
  liquidationThreshold: bigint
}

// Benqi-specific borrow data
export interface BenqiBorrowData extends BaseBorrowData {
  liquidity: bigint
  shortfall: bigint
}

// AAVE getUserAccountData return type:
// [totalCollateralBase, totalDebtBase, availableBorrowsBase, currentLiquidationThreshold, ltv, healthFactor]
export type AaveAccountData = [bigint, bigint, bigint, bigint, bigint, bigint]
