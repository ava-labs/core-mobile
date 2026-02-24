import { Address } from 'viem'
import { Network } from '@avalabs/core-chains-sdk'
import { borrowApyHistorySchema, supplyApyHistorySchema } from '../schema'
import { AAVE_V3_GQL_API_URL, AAVE_POOL_C_CHAIN_ADDRESS } from '../consts'
import { gqlQuery } from './gqlQuery'

/**
 * Fetches APY history from AAVE GraphQL API
 */
export const fetchAaveApyHistory = async (
  network: Network,
  underlyingAsset: Address
): Promise<{ supply: unknown; borrow: unknown }> => {
  const [supply, borrow] = await Promise.all([
    gqlQuery(
      AAVE_V3_GQL_API_URL,
      `query supplyAPYHistory($request: SupplyAPYHistoryRequest!) {
        supplyAPYHistory(request: $request) {
          avgRate { formatted }
        }
      }`,
      {
        request: {
          chainId: network.chainId,
          market: AAVE_POOL_C_CHAIN_ADDRESS,
          underlyingToken: underlyingAsset,
          window: 'LAST_MONTH'
        }
      }
    ),
    gqlQuery(
      AAVE_V3_GQL_API_URL,
      `query borrowAPYHistory($request: BorrowAPYHistoryRequest!) {
        borrowAPYHistory(request: $request) {
          avgRate { formatted }
        }
      }`,
      {
        request: {
          chainId: network.chainId,
          market: AAVE_POOL_C_CHAIN_ADDRESS,
          underlyingToken: underlyingAsset,
          window: 'LAST_MONTH'
        }
      }
    )
  ])
  return { supply, borrow }
}

/**
 * Parses APY history response and calculates averages
 */
export const parseAaveApyHistory = (
  supplyResponse: unknown,
  borrowResponse: unknown
): {
  historicalApyPercent: number | undefined
  historicalBorrowApyPercent: number | undefined
} => {
  const supplyApyHistory = supplyApyHistorySchema.safeParse(supplyResponse)
  const safeSupplyData = supplyApyHistory.success
    ? supplyApyHistory.data.data.supplyAPYHistory
    : []

  const historicalApyPercent =
    safeSupplyData.length > 0
      ? safeSupplyData.reduce(
          (acc, cur) => acc + Number.parseFloat(cur.avgRate.formatted),
          0
        ) / safeSupplyData.length
      : undefined

  const borrowApyHistory = borrowApyHistorySchema.safeParse(borrowResponse)
  const safeBorrowData = borrowApyHistory.success
    ? borrowApyHistory.data.data.borrowAPYHistory
    : []

  const historicalBorrowApyPercent =
    safeBorrowData.length > 0
      ? safeBorrowData.reduce(
          (acc, cur) => acc + Number.parseFloat(cur.avgRate.formatted),
          0
        ) / safeBorrowData.length
      : undefined

  return { historicalApyPercent, historicalBorrowApyPercent }
}
