import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType, TxToken } from '@avalabs/vm-module-types'
import {
  isCollectibleTransaction,
  isNftTransaction
} from 'features/activity/utils'
import { MarketToken } from 'store/watchlist'
import { Transaction } from 'store/transaction'
import { C_CHAIN_TOKEN_THRESHOLDS } from './constants/cChainTokenThresholds'

/** Matches subtitle USD on `TokenActivityListItem` (uses `tokens[0]` only). */
const MIN_USD_DISPLAY = 0.01

const C_CHAIN_MAINNET_ID = ChainId.AVALANCHE_MAINNET_ID

const { cChainThresholdByAddress, nativeTokenThresholdQuantity } =
  buildCChainThresholdLookups()

function buildCChainThresholdLookups(): {
  cChainThresholdByAddress: Map<string, number>
  nativeTokenThresholdQuantity: number | undefined
} {
  const byAddress = new Map<string, number>()
  let nativeQty: number | undefined

  for (const row of C_CHAIN_TOKEN_THRESHOLDS) {
    if (row.contractAddress === null) {
      nativeQty = row.quantity
    } else {
      byAddress.set(row.contractAddress.toLowerCase(), row.quantity)
    }
  }

  return {
    cChainThresholdByAddress: byAddress,
    nativeTokenThresholdQuantity: nativeQty
  }
}

/**
 * One pass over `allTokens` — same first-match semantics as
 * `getMarketTokenBySymbol` in useWatchlist (first token wins per symbol).
 * Used so per-tx filtering is O(1) symbol lookup instead of O(|allTokens|).
 */
export function buildSymbolToPriceMapFromMarketTokens(
  allTokens: MarketToken[]
): Map<string, number> {
  const map = new Map<string, number>()
  for (const token of allTokens) {
    const key = token.symbol.toLowerCase().trim()
    if (map.has(key)) {
      continue
    }
    const p = token.currentPrice
    if (p != null && p > 0) {
      map.set(key, p)
    }
  }
  return map
}

export function parseTxTokenAmount(
  amount: string | undefined
): number | undefined {
  if (amount === undefined) return undefined
  const n = Number(String(amount).replaceAll(',', ''))
  return Number.isFinite(n) ? n : undefined
}

function getCChainThresholdQuantityForToken(
  token: TxToken
): number | undefined {
  if (token.type === TokenType.NATIVE) {
    return nativeTokenThresholdQuantity
  }
  if ('address' in token && token.address) {
    return cChainThresholdByAddress.get(token.address.toLowerCase())
  }
  return undefined
}

/**
 * Returns true when the transaction should be hidden as below the minimum USD display value.
 * Uses `tokens[0]` only — same token as `TokenActivityListItem` subtitle USD.
 * Caller must skip when the selected network is testnet (see hook).
 * NFT / collectible txs are never filtered.
 */
export function shouldFilterLowValueActivityTransaction(
  tx: Transaction,
  symbolToPriceUsd: ReadonlyMap<string, number>
): boolean {
  if (tx.tokens.length === 0) {
    return false
  }

  if (isCollectibleTransaction(tx) || isNftTransaction(tx)) {
    return false
  }

  const token = tx.tokens[0]
  if (!token) {
    return false
  }

  const amount = parseTxTokenAmount(token.amount)
  if (amount === undefined) {
    return false
  }

  const chainId = Number(tx.chainId)
  const isCChainMainnet =
    Number.isFinite(chainId) && chainId === C_CHAIN_MAINNET_ID

  const priceKey = token.symbol.toLowerCase().trim()
  const price = symbolToPriceUsd.get(priceKey)
  if (price != null && price > 0) {
    return amount * price < MIN_USD_DISPLAY
  }

  if (!isCChainMainnet) {
    return false
  }

  const thresholdQty = getCChainThresholdQuantityForToken(token)
  if (thresholdQty === undefined) {
    return false
  }

  return amount < thresholdQty
}

export function filterOutLowValueActivityTransactions(
  transactions: Transaction[],
  options: {
    isTestnet: boolean
    symbolToPriceUsd: ReadonlyMap<string, number>
  }
): Transaction[] {
  if (options.isTestnet) {
    return transactions
  }
  const { symbolToPriceUsd } = options
  return transactions.filter(
    tx => !shouldFilterLowValueActivityTransaction(tx, symbolToPriceUsd)
  )
}
