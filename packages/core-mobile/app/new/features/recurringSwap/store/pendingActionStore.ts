import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import { ZustandStorageKeys, zustandPersistStorage } from 'utils/mmkv'
import { TransferSignatureReason } from '@avalabs/fusion-sdk'

// Per Markr docs: cancel / pause / resume are all on-chain TXs.
// Markr only flips the order's `status` once it observes the on-chain
// confirmation — typically a few seconds, occasionally longer. We
// deliberately avoid optimistically patching the React Query cache: any
// unrelated refetch (window focus, staleTime, sibling consumer mount) would
// overwrite the patch with the stale server value and flicker the card back
// into its previous state before the action TX is finally indexed.
//
// Instead, we record the orderId + which action was issued here. The
// schedule-card buttons read from this store, render the action's "-ing"
// label with a spinner, and disable themselves. The listeners-side cache
// subscriber clears the entry once the next refetch shows the schedule has
// reached the expected destination status, when the order drops out of the
// response entirely, or when the TTL fires (safety net in case the action TX
// is dropped/replaced).

export const PENDING_ACTION_TTL_MS = 10 * 60 * 1000

export type RecurringOrderActionType =
  | TransferSignatureReason.CancelRecurringSwap
  | TransferSignatureReason.PauseRecurringSwap
  | TransferSignatureReason.ResumeRecurringSwap

export interface PendingActionEntry {
  type: RecurringOrderActionType
  addedAt: number
  // The (account, chain) the action was issued under. Markr order IDs are
  // globally unique, so the map is still keyed by orderId alone — but the
  // listeners-side reconciler runs per-query (one query == one account/chain)
  // and must only clear entries scoped to the event's account/chain. Without
  // this, a sibling account's listOrders success reconciles THIS account's
  // pending order against the wrong list, finds it "missing", and clears the
  // spinner mid-flight (re-enabling the buttons for a redundant second TX).
  ownerAddress: string
  chainId: number
}

export interface PendingActionState {
  // Map of `orderId → entry`. Addresses/chain IDs aren't part of the key
  // because Markr order IDs are unique on their own. Only one in-flight
  // action per orderId is allowed by the orchestrator (a paused order can't
  // be pause-spammed, an active order can't be cancel+pause concurrently),
  // so this is a single-entry map per id rather than a per-type sub-map.
  // (account, chain) ride along inside the entry — see `ownerAddress`/`chainId`
  // above — so the reconciler can scope its clears.
  pending: Record<string, PendingActionEntry>
  markPending: (
    orderId: string,
    type: RecurringOrderActionType,
    scope: { ownerAddress: string; chainId: number }
  ) => void
  clearPending: (orderId: string) => void
  isExpired: (orderId: string, nowMs?: number) => boolean
}

// Shape stored on disk under the persist key. Only `pending` is durable —
// the action methods on `PendingActionState` are re-attached by the merge
// step at hydration time.
type PersistedShape = { pending: Record<string, PendingActionEntry> }

function isPersistedEntry(value: unknown): value is PendingActionEntry {
  if (!value || typeof value !== 'object') return false
  const e = value as Partial<PendingActionEntry>
  // Validate every field the listener-side reconciler reads. An entry
  // missing any of these would either fail the (account, chain) scope
  // check (and stick around until the TTL fired) or crash the
  // reconciler on the next list refetch.
  return (
    typeof e.type === 'string' &&
    typeof e.addedAt === 'number' &&
    typeof e.ownerAddress === 'string' &&
    typeof e.chainId === 'number'
  )
}

// Explicit migration so a device that rehydrates an older persisted shape
// can't load entries the runtime no longer knows how to reconcile. Without
// a `migrate` callback, zustand-persist still logs and discards on a
// version mismatch in v5 — but encoding it here makes the intent
// auditable and is robust to future zustand-internal changes / corrupted
// stores that slip through the version check.
export function migratePersistedPendingActionState(
  persistedState: unknown,
  version: number
): PersistedShape {
  // Pre-v3 entries pre-date the `ownerAddress` + `chainId` scoping fields
  // and the `unpause` → `resume` rename. The reconciler can't match
  // them to any future event, so the only thing keeping a stale entry
  // from sticking on the UI would be the 10-minute TTL safety net.
  // Clear them up front instead — the TTL guarantees nothing useful is
  // lost (anything still in-flight at upgrade time would have aged out
  // before the next listOrders refetch reconciles regardless).
  if (version < 3) return { pending: {} }

  // From v3 onward, defensively normalize: drop any entry that doesn't
  // carry the full shape the reconciler reads. Guards against a
  // hand-corrupted store, a future field addition that ships without a
  // version bump, or a partial write from a crashed prior session.
  const candidate =
    persistedState && typeof persistedState === 'object'
      ? (persistedState as { pending?: unknown }).pending ?? {}
      : {}
  const rawPending =
    candidate && typeof candidate === 'object'
      ? (candidate as Record<string, unknown>)
      : {}
  const pending: Record<string, PendingActionEntry> = {}
  for (const [orderId, raw] of Object.entries(rawPending)) {
    if (isPersistedEntry(raw)) pending[orderId] = raw
  }
  return { pending }
}

export const pendingActionStore = create<PendingActionState>()(
  persist(
    (set, get) => ({
      pending: {},

      markPending: (orderId, type, { ownerAddress, chainId }) => {
        set(state => ({
          pending: {
            ...state.pending,
            [orderId]: { type, addedAt: Date.now(), ownerAddress, chainId }
          }
        }))
      },

      clearPending: orderId => {
        set(state => {
          if (state.pending[orderId] === undefined) return state
          const next = { ...state.pending }
          delete next[orderId]
          return { pending: next }
        })
      },

      isExpired: (orderId, nowMs = Date.now()) => {
        const entry = get().pending[orderId]
        if (entry === undefined) return false
        return nowMs - entry.addedAt >= PENDING_ACTION_TTL_MS
      }
    }),
    {
      // New storage key + version — the previous shape was
      // `Record<string, number>` (raw addedAt). Reusing the old key would
      // surface a malformed-state hydration on existing devices. Old entries
      // have a 10-min TTL so the migration window is effectively zero —
      // anything still pending at upgrade time would have aged out before
      // the next listOrders refetch reconciles regardless.
      name: ZustandStorageKeys.RECURRING_PENDING_ACTION,
      // Cast: the shared `zustandPersistStorage` is upstream-typed as
      // `PersistStorage<StateStorage>` (a stale leftover), which would
      // force `PersistedState` to infer to `StateStorage` here. The
      // underlying MMKV adapter serializes any shape, so re-typing it
      // to the actual persisted slice (`PersistedShape`) is safe and
      // unlocks correctly-typed `partialize` + `migrate` callbacks.
      storage:
        zustandPersistStorage as unknown as PersistStorage<PersistedShape>,
      // v2: `'unpause'` → `'resume'` rename. Bumping discards any in-flight
      // 'unpause' entry persisted from a v1 client — acceptable given the
      // 10-min TTL: anything still pending at upgrade time would age out
      // before the next listOrders refetch reconciles anyway.
      //
      // v3: entries gained `ownerAddress` + `chainId`. A v2 entry has neither,
      // so it would never match an event's (account, chain) scope and could
      // only be cleared by the TTL safety net. Bumping discards them up front
      // — again a zero-impact migration given the 10-min TTL.
      version: 3,
      // Only the `pending` map is durable — the action methods on
      // `PendingActionState` are re-attached by the merge step on
      // hydration. Without an explicit `partialize` zustand would type
      // the persisted shape as the full state (including methods), and
      // the `migrate` callback below would have to return that shape
      // even though functions get stripped during JSON.stringify anyway.
      partialize: state => ({ pending: state.pending }),
      // Encode the version-bump intent so it's testable and auditable.
      // See `migratePersistedPendingActionState` for the policy: clear
      // pre-v3 state outright, and defensively drop malformed entries
      // from v3+ payloads.
      migrate: migratePersistedPendingActionState
    }
  )
)

// ─── UI selectors ────────────────────────────────────────────────────────────

const selectEntry = (
  state: PendingActionState,
  orderId: string | undefined
): PendingActionEntry | undefined =>
  orderId === undefined ? undefined : state.pending[orderId]

export const usePendingAction = (
  orderId: string | undefined
): PendingActionEntry | undefined =>
  pendingActionStore(state => selectEntry(state, orderId))

const useIsPendingOfType = (
  orderId: string | undefined,
  type: RecurringOrderActionType
): boolean =>
  pendingActionStore(state => selectEntry(state, orderId)?.type === type)

export const useIsCancelPending = (orderId: string | undefined): boolean =>
  useIsPendingOfType(orderId, TransferSignatureReason.CancelRecurringSwap)

export const useIsPausePending = (orderId: string | undefined): boolean =>
  useIsPendingOfType(orderId, TransferSignatureReason.PauseRecurringSwap)

export const useIsResumePending = (orderId: string | undefined): boolean =>
  useIsPendingOfType(orderId, TransferSignatureReason.ResumeRecurringSwap)
