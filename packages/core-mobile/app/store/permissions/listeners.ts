import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { removeAccount, selectAccounts } from 'store/account/slice'
import { canonicalizeAddress, revokeAllGrantsForAddresses } from './slice'
import { collectAccountAddresses } from './utils'

/**
 * Revoke a removed account's dApp connection grants (CP-14374).
 *
 * The invariant: grants are revoked whenever the base `removeAccount` action
 * fires. Every removal path dispatches it — `removeAccountWithActiveCheck`
 * (single account), `removeWallet` (fans out to `removeAccount` per account
 * before `_removeWallet`, see store/wallet/thunks.ts), and the direct
 * `removeAccount` dispatch in useManageWallet's "remove all accounts" flow. So
 * keying on the base action covers all wallet types and bulk wallet removal by
 * construction, without editing each removal branch.
 *
 * Reads from `getOriginalState()` because `removeAccount`'s payload is only the
 * accountId — the account's addresses must be read from the state *before* the
 * reducer deletes the account.
 *
 * Only revokes addresses the removed account UNIQUELY owns. The same address
 * (notably an EVM address) can belong to multiple accounts — e.g. a key
 * imported that also exists under a mnemonic — so an address still held by a
 * surviving account keeps its grant. During a wallet's per-account fan-out this
 * still converges: each sibling is already gone from the original state by the
 * time the last owner's `removeAccount` fires, so the final owner orphans and
 * revokes it.
 */
const revokeGrantsForRemovedAccount = (
  action: ReturnType<typeof removeAccount>,
  listenerApi: AppListenerEffectAPI
): void => {
  const accountId = action.payload
  const originalState = listenerApi.getOriginalState()
  const account = selectAccounts(originalState)[accountId]
  if (!account) return

  const removedAddresses = collectAccountAddresses(account)
  if (removedAddresses.length === 0) return

  // Addresses still owned by another account that survives this removal must
  // keep their grants (same canonicalization as the slice so checksum-vs-
  // lowercase EVM duplicates count as the same owner).
  const survivingAddresses = new Set(
    Object.values(selectAccounts(originalState))
      .filter(other => other.id !== accountId)
      .flatMap(collectAccountAddresses)
      .map(canonicalizeAddress)
  )
  const orphanedAddresses = removedAddresses.filter(
    address => !survivingAddresses.has(canonicalizeAddress(address))
  )
  if (orphanedAddresses.length === 0) return

  listenerApi.dispatch(revokeAllGrantsForAddresses(orphanedAddresses))
}

export const addPermissionsListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: removeAccount,
    effect: revokeGrantsForRemovedAccount
  })
}
