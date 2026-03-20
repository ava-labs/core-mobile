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

const cChainThresholdByAddress = buildCChainThresholdLookup()

function buildCChainThresholdLookup(): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of C_CHAIN_TOKEN_THRESHOLDS) {
    if (row.contractAddress) {
      map.set(row.contractAddress.toLowerCase(), row.quantity)
    }
  }
  return map
}

function getNativeThresholdQuantity(): number | undefined {
  const row = C_CHAIN_TOKEN_THRESHOLDS.find(r => r.contractAddress === null)
  return row?.quantity
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
    return getNativeThresholdQuantity()
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
  getMarketTokenBySymbol: (symbol: string) => MarketToken | undefined
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

  const price = getMarketTokenBySymbol(token.symbol)?.currentPrice
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
    getMarketTokenBySymbol: (symbol: string) => MarketToken | undefined
  }
): Transaction[] {
  if (options.isTestnet) {
    return transactions
  }
  return transactions.filter(
    tx =>
      !shouldFilterLowValueActivityTransaction(
        tx,
        options.getMarketTokenBySymbol
      )
  )
}
