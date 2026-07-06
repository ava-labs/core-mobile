import { TokenType } from '@avalabs/vm-module-types'
import type { QuoteFee } from '@avalabs/fusion-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote } from '../types'

/**
 * Returns true when a fee is denominated in the same token as the source asset.
 *
 * Native source → matches native fee token.
 * ERC20 source → matches ERC20 fee with the same address (case-insensitive).
 * SPL source   → matches SPL fee with the same mint address.
 */
const feeMatchesSourceToken = (
  f: QuoteFee,
  fromToken: LocalTokenWithBalance
): boolean => {
  if (fromToken.type === TokenType.NATIVE) {
    return f.token.type === 'native'
  }
  if (
    fromToken.type === TokenType.ERC20 &&
    f.token.type === 'erc20' &&
    'address' in f.token
  ) {
    return f.token.address.toLowerCase() === fromToken.address.toLowerCase()
  }
  if (
    fromToken.type === TokenType.SPL &&
    f.token.type === 'spl' &&
    'address' in f.token
  ) {
    return f.token.address === fromToken.address
  }
  return false
}

/**
 * Sums all additive fees denominated in the source token and applies a
 * uniform safety buffer.
 *
 * Fees must have `fundingModel === 'additive'` and
 * `chainId === quote.sourceChain.chainId`.
 *
 * Returns:
 *  - `raw`      – total additive fees before any buffer
 *  - `buffered` – buffered total (subtract this from balance for Max calculation)
 */
export const getTotalAdditiveSourceFee = (
  fromToken: LocalTokenWithBalance | undefined,
  quote: Quote | null,
  safetyBps: number
): { buffered: bigint; raw: bigint } => {
  const ZERO = { buffered: 0n, raw: 0n }
  if (!fromToken || !quote) return ZERO

  let raw = 0n

  for (const f of quote.fees) {
    if (f.fundingModel !== 'additive') continue
    if (f.chainId !== quote.sourceChain.chainId) continue
    if (!feeMatchesSourceToken(f, fromToken)) continue
    raw += f.amount
  }

  const buffered = (raw * (10000n + BigInt(Math.max(0, safetyBps)))) / 10000n

  return { buffered, raw }
}

/**
 * Sums all additive fees denominated in the source chain's native asset
 * (e.g. the CCIP bridge fee for cross-chain EVM swaps, charged in AVAX).
 *
 * Only relevant for non-native source tokens — for native source tokens these
 * fees are already captured by getTotalAdditiveSourceFee.
 *
 * Returns:
 *  - `raw`      – total before any buffer
 *  - `buffered` – buffered total (add to native balance requirement)
 */
export const getTotalAdditiveNativeFee = (
  fromToken: LocalTokenWithBalance | undefined,
  quote: Quote | null,
  safetyBps: number
): { buffered: bigint; raw: bigint } => {
  const ZERO = { buffered: 0n, raw: 0n }
  if (!fromToken || !quote) return ZERO
  // For native source tokens getTotalAdditiveSourceFee already covers this
  if (fromToken.type === TokenType.NATIVE) return ZERO

  let raw = 0n

  for (const f of quote.fees) {
    if (f.fundingModel !== 'additive') continue
    if (f.chainId !== quote.sourceChain.chainId) continue
    if (f.token.type !== 'native') continue
    raw += f.amount
  }

  const buffered = (raw * (10000n + BigInt(Math.max(0, safetyBps)))) / 10000n

  return { buffered, raw }
}
