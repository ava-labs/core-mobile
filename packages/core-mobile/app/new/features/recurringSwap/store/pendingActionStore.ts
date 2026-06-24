import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
}

export interface PendingActionState {
  // Map of `orderId → entry`. Addresses/chain IDs aren't part of the key
  // because Markr order IDs are unique on their own. Only one in-flight
  // action per orderId is allowed by the orchestrator (a paused order can't
  // be pause-spammed, an active order can't be cancel+pause concurrently),
  // so this is a single-entry map per id rather than a per-type sub-map.
  pending: Record<string, PendingActionEntry>
  markPending: (orderId: string, type: RecurringOrderActionType) => void
  clearPending: (orderId: string) => void
  isExpired: (orderId: string, nowMs?: number) => boolean
}

export const pendingActionStore = create<PendingActionState>()(
  persist(
    (set, get) => ({
      pending: {},

      markPending: (orderId, type) => {
        set(state => ({
          pending: {
            ...state.pending,
            [orderId]: { type, addedAt: Date.now() }
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
      storage: zustandPersistStorage,
      // v2: `'unpause'` → `'resume'` rename. Bumping discards any in-flight
      // 'unpause' entry persisted from a v1 client — acceptable given the
      // 10-min TTL: anything still pending at upgrade time would age out
      // before the next listOrders refetch reconciles anyway.
      version: 2
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
