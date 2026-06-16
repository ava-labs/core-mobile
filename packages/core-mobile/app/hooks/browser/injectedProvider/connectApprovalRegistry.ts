import { Account } from 'store/account/types'
import { PeerMeta } from 'store/rpc/types'

/**
 * Module-level registry for in-flight injected-provider connect approvals
 * (`eth_requestAccounts` / `wallet_requestPermissions`), keyed by a minted
 * `approvalId = ${tabId}:${requestId}:${nonce}` (the nonce guarantees
 * uniqueness — requestIds are reused after a page reload). (CP-14385)
 *
 * Replaces the single global `walletConnectCache.injectedAuthParams` slot,
 * which collided across browser tabs: a backgrounded tab's request overwrote
 * the slot but was never read by the already-mounted authorize screen, so it
 * hung until its 90s timeout. Here each request owns its own entry, so
 * concurrent tabs no longer clobber each other.
 *
 * Invariants:
 * - At most ONE entry per tab. A new request from a tab that already has one
 *   SUPERSEDES it in place (rejects the old, takes its exact queue slot) so
 *   ordering relative to other tabs is preserved (same-tab supersede must not
 *   reshuffle the queue — see CP-14385 review).
 * - `queue[0]` is the active (currently-shown) approval. Only one modal shows
 *   at a time; navigation is driven by the {@link ConnectNavEffect} returned
 *   from each mutation.
 *
 * This is injected-connect-only and deliberately does NOT touch the shared
 * `createCache` / `withWalletConnectCache` contract used by WalletConnect and
 * the other approval screens.
 */
export type ConnectApprovalEntry = {
  approvalId: string
  tabId: string
  peerMeta: PeerMeta
  approve: (accounts: Account[]) => void
  reject: (err: unknown) => void
}

/** What the caller should do with the modal after a registry mutation. */
export type ConnectNavEffect =
  | { type: 'open'; approvalId: string } // no modal shown → open it
  | { type: 'replace'; approvalId: string } // swap the shown modal to another approval
  | { type: 'dismiss' } // queue now empty → close the modal
  | { type: 'none' } // active modal unchanged

/** Input to register a connect approval; the registry mints the unique key. */
export type ConnectApprovalRequest = {
  tabId: string
  // JSON-RPC request id — context only (NOT the uniqueness source: the shim's
  // request counter resets to 0 on page reload, so ids are reused). The registry
  // appends a monotonic nonce so each approval gets a truly unique key.
  requestId: number
  peerMeta: PeerMeta
  approve: (accounts: Account[]) => void
  reject: (err: unknown) => void
}

class ConnectApprovalRegistry {
  private entries = new Map<string, ConnectApprovalEntry>()
  // FIFO of approvalIds; queue[0] is active (shown). Source of truth for order.
  private queue: string[] = []
  // Monotonic, guarantees a unique approvalId even when requestIds are reused.
  private nonce = 0

  get(approvalId: string): ConnectApprovalEntry | undefined {
    return this.entries.get(approvalId)
  }

  /** Whether any connect approval is currently active (a modal is showing). */
  hasActive(): boolean {
    return this.queue.length > 0
  }

  private activeId(): string | null {
    return this.queue[0] ?? null
  }

  private findByTab(tabId: string): string | undefined {
    return this.queue.find(id => this.entries.get(id)?.tabId === tabId)
  }

  /**
   * Register a connect approval. If the requesting tab already has one, supersede
   * it atomically: reject the old promise and put the new entry in the old's
   * exact slot (so a queued sibling tab keeps its position).
   *
   * Returns the minted `approvalId` (route key) and the nav effect.
   *
   * @param supersedeError error to reject a superseded same-tab request with.
   */
  request(
    req: ConnectApprovalRequest,
    supersedeError: unknown
  ): { approvalId: string; effect: ConnectNavEffect } {
    // Mint a guaranteed-unique key: tabId:requestId is NOT unique (reused after
    // page reload), so a monotonic nonce makes each approval distinct. (CP-14385)
    const approvalId = `${req.tabId}:${req.requestId}:${this.nonce++}`
    const entry: ConnectApprovalEntry = {
      approvalId,
      tabId: req.tabId,
      peerMeta: req.peerMeta,
      approve: req.approve,
      reject: req.reject
    }

    const prevId = this.findByTab(entry.tabId)
    if (prevId) {
      const wasActive = this.queue[0] === prevId
      const prev = this.entries.get(prevId)
      // Swap in place BEFORE rejecting prev, so prev's reject can't observe (or
      // advance) a half-updated queue.
      const idx = this.queue.indexOf(prevId)
      if (idx >= 0) this.queue[idx] = approvalId
      this.entries.delete(prevId)
      this.entries.set(approvalId, entry)
      prev?.reject(supersedeError)
      return {
        approvalId,
        effect: wasActive ? { type: 'replace', approvalId } : { type: 'none' }
      }
    }

    const hadActive = this.activeId() !== null
    this.entries.set(approvalId, entry)
    this.queue.push(approvalId)
    return {
      approvalId,
      effect: hadActive ? { type: 'none' } : { type: 'open', approvalId }
    }
  }

  /** Approve a specific approval and advance the modal if it was active. */
  resolve(approvalId: string, accounts: Account[]): ConnectNavEffect {
    return this.settle(approvalId, entry => entry.approve(accounts))
  }

  /** Reject a specific approval and advance the modal if it was active. */
  reject(approvalId: string, err: unknown): ConnectNavEffect {
    return this.settle(approvalId, entry => entry.reject(err))
  }

  /**
   * Reject every approval belonging to a tab (tab unmount / origin change).
   * Returns the single active-modal nav effect, if the active one was removed.
   */
  rejectByTab(tabId: string, err: unknown): ConnectNavEffect {
    const ids = this.queue.filter(id => this.entries.get(id)?.tabId === tabId)
    let effect: ConnectNavEffect = { type: 'none' }
    for (const id of ids) {
      const next = this.reject(id, err)
      if (next.type !== 'none') effect = next
    }
    return effect
  }

  private settle(
    approvalId: string,
    runCallback: (entry: ConnectApprovalEntry) => void
  ): ConnectNavEffect {
    const entry = this.entries.get(approvalId)
    if (!entry) return { type: 'none' }
    const wasActive = this.queue[0] === approvalId
    this.remove(approvalId)
    runCallback(entry)
    if (!wasActive) return { type: 'none' }
    const next = this.activeId()
    return next ? { type: 'replace', approvalId: next } : { type: 'dismiss' }
  }

  private remove(approvalId: string): void {
    this.entries.delete(approvalId)
    const idx = this.queue.indexOf(approvalId)
    if (idx >= 0) this.queue.splice(idx, 1)
  }

  /** Test-only: reset all state between tests. */
  _resetForTests(): void {
    this.entries.clear()
    this.queue = []
    this.nonce = 0
  }
}

export const connectApprovalRegistry = new ConnectApprovalRegistry()
