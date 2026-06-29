import { loadArrayFromStorage, saveArrayToStorage } from 'utils/mmkv/utils'
import { commonStorage } from 'utils/mmkv/storages'

// Persisted set of order IDs this device has already subscribed to for
// push notifications, scoped per (ownerAddress, chainId). The auto-subscribe
// listener (`recurringSwap/store/listeners.ts`) uses this to avoid re-issuing
// `/v1/push/recurring-swaps/subscribe` on every listOrders refetch — Sarp's
// backend treats re-subscribes as idempotent reactivations, but skipping
// the redundant call is cheaper and clearer in network logs.
//
// Bound persisted size so the key cannot grow without limit for heavy users.
// 2000 = ~30 years of daily orders, well past any realistic usage; entries
// past the bound are dropped oldest-first so the most recent state is
// preserved (the listener will re-subscribe any evicted order the next time
// it appears in a listOrders response).
const MAX_SUBSCRIBED_ORDERS = 2000

const entriesKeyFor = (ownerAddress: string, chainId: number): string =>
  `recurringSwap.subscribedOrders.${ownerAddress.toLowerCase()}.${chainId}`

export function loadSubscribedOrders(
  ownerAddress: string,
  chainId: number
): Set<string> {
  const raw = loadArrayFromStorage<unknown>(
    commonStorage,
    entriesKeyFor(ownerAddress, chainId)
  )
  if (!Array.isArray(raw)) return new Set()
  return new Set(raw.filter((v): v is string => typeof v === 'string'))
}

export function saveSubscribedOrders(
  ownerAddress: string,
  chainId: number,
  keys: Set<string>
): void {
  const arr = Array.from(keys)
  const trimmed =
    arr.length > MAX_SUBSCRIBED_ORDERS
      ? arr.slice(arr.length - MAX_SUBSCRIBED_ORDERS)
      : arr

  saveArrayToStorage(
    commonStorage,
    entriesKeyFor(ownerAddress, chainId),
    trimmed
  )
}
