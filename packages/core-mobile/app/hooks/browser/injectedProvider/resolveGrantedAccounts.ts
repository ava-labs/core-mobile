/**
 * Ordering rule for the granted addresses returned to a dApp by the EIP-2255
 * handlers (`eth_requestAccounts` / `wallet_getPermissions`).
 *
 * Used by the router so an explicit account request returns the full granted
 * set — switching the wallet's active account must not force the dApp to
 * re-grant.
 *
 * Rules:
 * - Empty granted list → `[]` (caller typically falls through to a prompt).
 * - Active address present in the granted set → active sorted first, other
 *   granted addresses follow in their original slice order.
 * - Active address not in the granted set → granted list returned as-is.
 */
export function resolveGrantedAccounts(
  granted: string[],
  active: string | undefined
): string[] {
  if (granted.length === 0) return []
  if (active && granted.includes(active)) {
    return [active, ...granted.filter(addr => addr !== active)]
  }
  return granted
}

/**
 * Accounts to advertise to the dApp via `accountsChanged` on the *passive*
 * paths — page-load priming and wallet active-account switches.
 *
 * Differs from {@link resolveGrantedAccounts}: when the active account is NOT
 * in the granted set this returns `[]`, not the granted list. The injected
 * signer always signs with the wallet's active account (the dApp's requested
 * `from` is ignored), so advertising other granted addresses while an
 * ungranted account is active would let the dApp believe it can transact as an
 * account that will never actually sign. Emitting `[]` makes the dApp reflect a
 * disconnected state (transacting UI disabled) until the user switches back to
 * a granted account or reconnects (CP-14382).
 */
export function resolveActiveConnectedAccounts(
  granted: string[],
  active: string | undefined
): string[] {
  if (!active || !granted.includes(active)) return []
  return resolveGrantedAccounts(granted, active)
}
