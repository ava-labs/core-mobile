import { erc20Abi, Address, PublicClient } from 'viem'
import { readContract } from 'viem/actions'
import { Network } from '@avalabs/core-chains-sdk'
import { type DefiMarket, AaveReserveData, MarketNames } from '../types'
import { MeritAprs } from '../hooks/aave/useMeritAprs'
import {
  formatAaveInterest,
  formatAaveSupplyApy,
  formatAmount
} from './formatInterest'
import { getAaveDepositedBalance } from './getAaveDepositedBalance'
import { getUniqueMarketId } from './getUniqueMarketId'
import { bigIntToBig } from './bigInt'
import { fetchAaveApyHistory, parseAaveApyHistory } from './fetchAaveApyHistory'
import { getMeritAprBonus } from './getMeritAprBonus'

type EnrichMarketDataParams = {
  market: AaveReserveData
  network: Network
  networkClient: PublicClient
  addressEVM: string
  meritAprs: MeritAprs | undefined
  getCChainToken: (
    symbol: string,
    address: Address
  ) => { logoUri?: string } | undefined
}

/**
 * Enriches a single AAVE market with additional data (APY, balances, historical data)
 */
export const enrichAaveMarketData = async ({
  market,
  network,
  networkClient,
  addressEVM,
  meritAprs,
  getCChainToken
}: EnrichMarketDataParams): Promise<DefiMarket> => {
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
  const token = getCChainToken(market.symbol, market.underlyingAsset)

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
    totalDeposits: formatAmount(bigIntToBig(totalSupply), decimals),
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
}
