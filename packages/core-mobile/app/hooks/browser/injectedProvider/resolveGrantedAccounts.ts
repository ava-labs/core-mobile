/**
 * Shared ordering rule for granted addresses returned to a dApp.
 *
 * Used by both the router's EIP-2255 handlers and the hook's
 * `handleDomainMetadata` prime path so the two sites always produce the
 * same accounts-list shape.
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
