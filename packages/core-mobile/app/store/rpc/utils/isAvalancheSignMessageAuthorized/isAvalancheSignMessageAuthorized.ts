import { RpcMethod } from '@avalabs/vm-module-types'
import { SessionTypes } from '@walletconnect/types'
import { CoreAccountAddresses } from 'store/rpc/handlers/wc_sessionRequest/utils'
import { isAccountApproved } from 'store/rpc/utils/isAccountApproved/isAccountApproved'

/**
 * Request-time WalletConnect account authorization for `avalanche_signMessage`
 * (CP-14604 follow-up).
 *
 * The ApprovalController grant check runs on `signingData.account` — the
 * module-resolved signer address. `avalanche_signMessage` is the one signing
 * method whose signer is chosen by a dApp-supplied account *index*
 * (`params: [message, accountIndex]`) instead of an address, so its signingData
 * carries `accountIndex`, not `account`, and the ApprovalController check never
 * sees it. Without this, a dApp granted account A could request a signature from
 * account B of the same wallet.
 *
 * This resolves the signer the same way the approval screen does
 * (`getAccountSelector`): an explicit non-negative index selects that account
 * via `selectAccountByIndex`; otherwise the active account signs. It then checks
 * the resolved account against the session's granted accounts.
 *
 * Returns `true` (authorized / no-op) for every other method and for in-app /
 * injected-browser requests, so callers can invoke it unconditionally. Fails
 * closed: a missing WC session (deleted, expired, or client uninitialized) has
 * no grant to check against and is treated as unauthorized.
 */
export const isAvalancheSignMessageAuthorized = ({
  method,
  isInAppRequest,
  params,
  caip2ChainId,
  activeAccount,
  getAccountByIndex,
  getSession
}: {
  method: string
  isInAppRequest: boolean
  params: unknown
  caip2ChainId: string
  activeAccount: CoreAccountAddresses
  getAccountByIndex: (index: number) => CoreAccountAddresses | undefined
  getSession: () => SessionTypes.Struct | undefined
}): boolean => {
  if (isInAppRequest || method !== RpcMethod.AVALANCHE_SIGN_MESSAGE) {
    return true
  }

  // Mirror the avalanche-module param shape ([message, accountIndex]). Its
  // schema is z.number().nonnegative() — NOT .int() — so a fractional index
  // (e.g. 0.5) is accepted and passed through to signingData.accountIndex, and
  // both the approval screen and the signer resolve it via selectAccountByIndex,
  // which finds no match and falls back to accounts[0]. We must therefore treat
  // ANY non-negative finite number as an explicit index and resolve it the SAME
  // way (getAccountByIndex), so the account we authorize is byte-for-byte the
  // account that will sign. Checking the active account for a fractional index
  // instead would reopen the exact bypass this guards against. A negative / NaN
  // / non-numeric value is rejected by the module schema before signing, so we
  // treat it as "no index" (active account) — inert either way.
  const index = Array.isArray(params) ? params[1] : undefined
  const hasExplicitIndex =
    typeof index === 'number' && Number.isFinite(index) && index >= 0

  const account = hasExplicitIndex ? getAccountByIndex(index) : activeAccount

  let session: SessionTypes.Struct | undefined
  try {
    session = getSession()
  } catch {
    session = undefined
  }

  if (!account || !session) {
    return false
  }

  return isAccountApproved(account, caip2ChainId, session.namespaces)
}
