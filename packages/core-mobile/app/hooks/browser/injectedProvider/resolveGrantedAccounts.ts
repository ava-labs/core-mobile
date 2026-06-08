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
 *
 * Address matching is case-insensitive (EVM addresses vary by hex casing, and
 * the signing gate lowercases) so connection state can't disagree with signing
 * authorization over casing alone.
 */
export function resolveGrantedAccounts(
  granted: string[],
  active: string | undefined
): string[] {
  if (granted.length === 0) return []
  // De-dupe case-insensitively before ordering: permissions are keyed by the
  // raw address string and not normalized on grant, so the same address can
  // appear under different hex casing. Returning it twice via accountsChanged /
  // EIP-2255 is non-standard and confuses dApps. Keep the first-seen casing.
  const seen = new Set<string>()
  const deduped = granted.filter(addr => {
    const lower = addr.toLowerCase()
    if (seen.has(lower)) return false
    seen.add(lower)
    return true
  })
  const activeLower = active?.toLowerCase()
  const activeGranted = activeLower
    ? deduped.find(addr => addr.toLowerCase() === activeLower)
    : undefined
  if (activeGranted) {
    return [activeGranted, ...deduped.filter(addr => addr !== activeGranted)]
  }
  return deduped
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
  const activeLower = active?.toLowerCase()
  if (!activeLower || !granted.some(addr => addr.toLowerCase() === activeLower))
    return []
  return resolveGrantedAccounts(granted, active)
}
