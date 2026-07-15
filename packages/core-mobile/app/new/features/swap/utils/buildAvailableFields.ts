import { TokenUnit } from '@avalabs/core-utils-sdk'
import type { LocalTokenWithBalance } from 'store/balance'

/**
 * Carries the P/X-chain "available" (swappable) balance fields from a balance
 * store token onto a rebuilt swap token.
 *
 * The swap token mappers (`mapApiTokenToLocal` / `mapSdkAssetToLocal`) construct
 * a fresh `LocalTokenWithBalance` and previously copied only `balance*`. For
 * P-chain (PVM) / X-chain (AVM) AVAX that dropped `available` / balancePerType,
 * so a token preselected via navigation params (e.g. from the token-detail
 * screen) lost its swappable-balance data and `getSwappableBalance` fell back to
 * the full `balance` including staked funds. Spread the result of this into the
 * mapped token so `available` survives the rebuild. (CP-14788)
 *
 * Returns an empty object for every token type without an `available` field
 * (EVM, ERC20, BTC, SVM, SPL), so it's a no-op there.
 *
 * `availableDisplayValue` is recomputed from `available` at the resolved
 * `decimals` — matching how the mappers recompute `balanceDisplayValue` — so the
 * display precision stays consistent with the rebuilt token's decimals.
 */
export const buildAvailableFields = (
  balanceData: LocalTokenWithBalance | undefined,
  decimals: number,
  symbol: string
): Partial<
  Pick<
    Extract<LocalTokenWithBalance, { available?: bigint }>,
    | 'available'
    | 'availableDisplayValue'
    | 'availableInCurrency'
    | 'availableCurrencyDisplayValue'
    | 'balancePerType'
  >
> => {
  if (
    !balanceData ||
    !('available' in balanceData) ||
    typeof balanceData.available !== 'bigint'
  ) {
    return {}
  }

  const available = balanceData.available
  return {
    available,
    availableDisplayValue: new TokenUnit(
      available,
      decimals,
      symbol
    ).toDisplay(),
    availableInCurrency: balanceData.availableInCurrency,
    availableCurrencyDisplayValue: balanceData.availableCurrencyDisplayValue,
    balancePerType: balanceData.balancePerType
  }
}
