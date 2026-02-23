import { Address, PublicClient } from 'viem'
import { multicall } from 'viem/actions'
import { AaveAccountData, AaveBorrowData, BenqiBorrowData } from '../types'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from '../abis/aaveAvalanche3PoolProxy'
import { AAVE_PRICE_ORACLE_ABI } from '../abis/aavePriceOracle'
import { BENQI_COMPTROLLER_ABI } from '../abis/benqiComptroller'
import { BENQI_PRICE_ORACLE } from '../abis/benqiPriceOracle'
import { BENQI_Q_TOKEN } from '../abis/benqiQToken'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_PRICE_ORACLE_C_CHAIN_ADDRESS,
  BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
  BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
  WAD_BIGINT
} from '../consts'

export async function fetchAaveUserBorrowData(
  networkClient: PublicClient,
  userAddress: Address,
  tokenAddress?: Address
): Promise<AaveBorrowData> {
  // Use multicall to fetch account data and token price in the same block
  // This ensures price consistency and reduces timing issues
  const accountDataContract = {
    address: AAVE_POOL_C_CHAIN_ADDRESS,
    abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
    functionName: 'getUserAccountData' as const,
    args: [userAddress] as const
  }

  const priceContract = tokenAddress
    ? {
        address: AAVE_PRICE_ORACLE_C_CHAIN_ADDRESS,
        abi: AAVE_PRICE_ORACLE_ABI,
        functionName: 'getAssetPrice' as const,
        args: [tokenAddress] as const
      }
    : null

  const contracts = priceContract
    ? [accountDataContract, priceContract]
    : [accountDataContract]

  const results = await multicall(networkClient, { contracts })

  // Parse account data
  const accountDataResult = results[0]
  if (
    !accountDataResult ||
    accountDataResult.status !== 'success' ||
    !accountDataResult.result
  ) {
    throw new Error('Failed to fetch AAVE user account data')
  }

  const accountData = accountDataResult.result as AaveAccountData
  const [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ,
    healthFactor
  ] = accountData

  // Parse token price
  let tokenPriceUSD = 0n
  if (tokenAddress && results[1]?.status === 'success') {
    tokenPriceUSD = results[1].result as bigint
  }

  return {
    availableBorrowsUSD: availableBorrowsBase,
    totalCollateralUSD: totalCollateralBase,
    totalDebtUSD: totalDebtBase,
    healthFactor,
    liquidationThreshold: currentLiquidationThreshold,
    tokenPriceUSD
  }
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export async function fetchBenqiUserBorrowData(
  networkClient: PublicClient,
  userAddress: Address,
  qTokenAddress?: Address
): Promise<BenqiBorrowData> {
  // First, get account liquidity and assets in
  const [liquidityResult, assetsInResult] = await multicall(networkClient, {
    contracts: [
      {
        address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
        abi: BENQI_COMPTROLLER_ABI,
        functionName: 'getAccountLiquidity',
        args: [userAddress]
      },
      {
        address: BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
        abi: BENQI_COMPTROLLER_ABI,
        functionName: 'getAssetsIn',
        args: [userAddress]
      }
    ] as const
  })

  if (liquidityResult.status !== 'success' || !liquidityResult.result) {
    throw new Error('Failed to fetch Benqi account liquidity')
  }

  const [errorCode, liquidity, shortfall] = liquidityResult.result

  // Check for Benqi/Compound error codes (0 = NO_ERROR)
  if (errorCode !== 0n) {
    throw new Error(`Benqi getAccountLiquidity error code: ${errorCode}`)
  }
  const assetsIn =
    assetsInResult.status === 'success'
      ? (assetsInResult.result as Address[])
      : []

  // Fetch borrow balances and prices for all assets user is in
  let totalBorrowUSD = 0n

  if (assetsIn.length > 0) {
    // Build multicall for borrow balances and prices
    const borrowCalls = assetsIn.flatMap(qToken => [
      {
        address: qToken,
        abi: BENQI_Q_TOKEN,
        functionName: 'borrowBalanceStored' as const,
        args: [userAddress]
      },
      {
        address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
        abi: BENQI_PRICE_ORACLE,
        functionName: 'getUnderlyingPrice' as const,
        args: [qToken]
      }
    ])

    const borrowResults = await multicall(networkClient, {
      contracts: borrowCalls
    })

    // Process results: each asset has 2 results (balance, price)
    for (let i = 0; i < assetsIn.length; i++) {
      const balanceResult = borrowResults[i * 2]
      const priceResult = borrowResults[i * 2 + 1]

      if (
        balanceResult?.status === 'success' &&
        priceResult?.status === 'success'
      ) {
        const borrowBalance = balanceResult.result as bigint
        const price = priceResult.result as bigint

        // borrowValueUSD = borrowBalance * price / 1e18 (WAD)
        // Note: price is scaled by 10^(36-decimals), and borrowBalance is in token decimals
        // The result is in 18 decimals (WAD)
        if (borrowBalance > 0n) {
          totalBorrowUSD += (borrowBalance * price) / WAD_BIGINT
        }
      }
    }
  }

  // Get token price if qToken address provided
  let tokenPriceUSD = 0n
  if (qTokenAddress) {
    const priceResult = await networkClient.readContract({
      address: BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
      abi: BENQI_PRICE_ORACLE,
      functionName: 'getUnderlyingPrice',
      args: [qTokenAddress]
    })
    tokenPriceUSD = priceResult
  }

  // For Benqi: availableBorrowsUSD = liquidity (in 18 decimals)
  return {
    availableBorrowsUSD: liquidity,
    totalDebtUSD: totalBorrowUSD,
    tokenPriceUSD,
    liquidity,
    shortfall
  }
}

// Re-export for backward compatibility
export { convertUsdToTokenAmount } from './convertUsdToTokenAmount'
