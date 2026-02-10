import { skipToken, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Address, createPublicClient, http, PublicClient } from 'viem'
import { multicall } from 'viem/actions'
import { selectActiveAccount } from 'store/account'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { getViemChain } from 'utils/getViemChain/getViemChain'
import { MarketName, MarketNames } from '../types'
import { AAVE_AVALANCHE3_POOL_PROXY_ABI } from '../abis/aaveAvalanche3PoolProxy'
import { AAVE_PRICE_ORACLE_ABI } from '../abis/aavePriceOracle'
import { BENQI_COMPTROLLER_ABI } from '../abis/benqiComptroller'
import { BENQI_PRICE_ORACLE } from '../abis/benqiPriceOracle'
import {
  AAVE_POOL_C_CHAIN_ADDRESS,
  AAVE_PRICE_ORACLE_C_CHAIN_ADDRESS,
  BENQI_COMPTROLLER_C_CHAIN_ADDRESS,
  BENQI_PRICE_ORACLE_C_CHAIN_ADDRESS,
  WAD
} from '../consts'

// Minimal qToken ABI for borrowBalanceStored
const BENQI_QTOKEN_BORROW_ABI = [
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'borrowBalanceStored',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
] as const

export interface UserBorrowData {
  // Common fields
  availableBorrowsUSD: bigint
  tokenPriceUSD: bigint

  // AAVE specific
  healthFactor?: bigint
  totalCollateralUSD: bigint
  totalDebtUSD: bigint
  liquidationThreshold?: bigint

  // Benqi specific
  benqiLiquidity?: bigint
  benqiShortfall?: bigint
  benqiTotalBorrowUSD?: bigint
}

async function fetchAaveUserBorrowData(
  networkClient: PublicClient,
  userAddress: Address,
  tokenAddress?: Address
): Promise<UserBorrowData> {
  // Fetch user account data
  const accountData = await networkClient.readContract({
    address: AAVE_POOL_C_CHAIN_ADDRESS,
    abi: AAVE_AVALANCHE3_POOL_PROXY_ABI,
    functionName: 'getUserAccountData',
    args: [userAddress]
  })

  const [
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase,
    currentLiquidationThreshold,
    ,
    healthFactor
  ] = accountData

  // Get token price (8 decimals) if token address provided
  let tokenPriceUSD = 0n
  if (tokenAddress) {
    tokenPriceUSD = await networkClient.readContract({
      address: AAVE_PRICE_ORACLE_C_CHAIN_ADDRESS,
      abi: AAVE_PRICE_ORACLE_ABI,
      functionName: 'getAssetPrice',
      args: [tokenAddress]
    })
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

async function fetchBenqiUserBorrowData(
  networkClient: PublicClient,
  userAddress: Address,
  qTokenAddress?: Address
): Promise<UserBorrowData> {
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

  const [, liquidity, shortfall] = liquidityResult.result
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
        abi: BENQI_QTOKEN_BORROW_ABI,
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
          totalBorrowUSD += (borrowBalance * price) / BigInt(10 ** WAD)
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
    totalCollateralUSD: 0n, // Not directly available from Benqi
    totalDebtUSD: totalBorrowUSD,
    tokenPriceUSD,
    benqiLiquidity: liquidity,
    benqiShortfall: shortfall,
    benqiTotalBorrowUSD: totalBorrowUSD
  }
}

/**
 * Converts USD amount to token amount
 * @param params.usdAmount - Amount in USD (with usdDecimals precision)
 * @param params.tokenPriceUSD - Token price in USD (with priceDecimals precision)
 * @param params.tokenDecimals - Decimals of the target token
 * @param params.usdDecimals - Decimals of the USD amount
 * @param params.priceDecimals - Decimals of the price
 */
export function convertUsdToTokenAmount(params: {
  usdAmount: bigint
  tokenPriceUSD: bigint
  tokenDecimals: number
  usdDecimals: number
  priceDecimals: number
}): bigint {
  const {
    usdAmount,
    tokenPriceUSD,
    tokenDecimals,
    usdDecimals,
    priceDecimals
  } = params

  if (tokenPriceUSD === 0n) return 0n

  // tokenAmount = usdAmount * 10^tokenDecimals * 10^priceDecimals / (tokenPriceUSD * 10^usdDecimals)
  // Simplified: tokenAmount = usdAmount * 10^(tokenDecimals + priceDecimals - usdDecimals) / tokenPriceUSD
  const scaleFactor = tokenDecimals + priceDecimals - usdDecimals
  if (scaleFactor >= 0) {
    return (usdAmount * BigInt(10 ** scaleFactor)) / tokenPriceUSD
  } else {
    return usdAmount / (tokenPriceUSD * BigInt(10 ** -scaleFactor))
  }
}

export const useUserBorrowData = (
  marketName: MarketName,
  tokenAddress?: Address
): {
  data: UserBorrowData | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const userAddress = activeAccount?.addressC as Address | undefined
  const cChainNetwork = useCChainNetwork()

  const networkClient = useMemo(() => {
    if (!cChainNetwork) {
      return undefined
    }
    const cChain = getViemChain(cChainNetwork)
    return createPublicClient({ chain: cChain, transport: http() })
  }, [cChainNetwork])

  const shouldFetch = !!networkClient && !!userAddress

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      ReactQueryKeys.USER_BORROW_DATA,
      marketName,
      tokenAddress,
      userAddress,
      cChainNetwork?.chainId
    ],
    queryFn: shouldFetch
      ? async () => {
          if (marketName === MarketNames.aave) {
            return fetchAaveUserBorrowData(
              networkClient,
              userAddress,
              tokenAddress
            )
          } else {
            return fetchBenqiUserBorrowData(
              networkClient,
              userAddress,
              tokenAddress
            )
          }
        }
      : skipToken,
    staleTime: 30 * 1000 // 30 seconds
  })

  return {
    data,
    isLoading,
    isFetching,
    error
  }
}
