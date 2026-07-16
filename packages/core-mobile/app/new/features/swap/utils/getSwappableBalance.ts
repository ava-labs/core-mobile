import type { LocalTokenWithBalance } from 'store/balance'

/**
 * Returns the portion of a token's balance that is actually available to swap.
 *
 * P-chain (PVM) and X-chain (AVM) AVAX report a `balance` that includes
 * staked/locked funds, which cannot be swapped. Those token types expose an
 * `available` field (for P-chain, the unlocked/unstaked portion) — prefer it so
 * the swap form's displayed balance, its percentage/Max quick-amounts, and the
 * balance validation all reflect only what the user can actually swap. This
 * mirrors the send flow, which already validates P-chain against `available`
 * (see app/new/common/hooks/send/utils/pvm/validate.ts).
 *
 * Every other token type (EVM, ERC20, BTC, SVM, SPL) has no `available` field,
 * so `balance` is the swappable amount. (CP-14788)
 */
export const getSwappableBalance = (token: LocalTokenWithBalance): bigint => {
  if ('available' in token && typeof token.available === 'bigint') {
    return token.available
  }
  return token.balance
}

/**
 * Formatted-string counterpart to {@link getSwappableBalance}, for display in
 * lists/rows. Prefers the P/X-chain `availableDisplayValue` (excludes
 * staked/locked funds) and falls back to `balanceDisplayValue` for every other
 * token type. (CP-14788)
 */
export const getSwappableBalanceDisplayValue = (
  token: LocalTokenWithBalance
): string => {
  if (
    'availableDisplayValue' in token &&
    typeof token.availableDisplayValue === 'string'
  ) {
    return token.availableDisplayValue
  }
  return token.balanceDisplayValue
}
