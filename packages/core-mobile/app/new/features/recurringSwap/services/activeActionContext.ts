import type { RecurringFrequency } from '@avalabs/fusion-sdk'

// Side-channel that ferries display metadata about an in-flight recurring
// action from the hook → ApprovalController. The fusion-sdk's `execute*`
// methods sign + broadcast internally, so mobile no longer dispatches the
// recurring TX itself. To still render the labeled preview
// (`<RecurrenceDetails />`) on the approval modal, we stash the rich
// context here before the SDK call and have `EvmSigner.signOne` merge it
// into `request()`'s `context` whenever it sees the recurring synthetic
// `Quote` (`aggregator.id` starts with `markr-recurring`).
//
// Design constraints:
//   - The synthetic Quote the SDK builds for the recurring path
//     carries only `tokenIn`/`tokenOut` addresses + an
//     aggregator.id discriminator — not the display strings (symbols,
//     frequency, order count) the preview needs. Hence the side channel.
//   - Per-action-type slots keyed by the SDK's aggregator.id
//     (`markr-recurring` → fill, `markr-recurring-{cancel,pause,unpause}`
//     → order action). This means a fill in flight and a cancel in flight
//     can coexist without their previews stomping each other — a real
//     concern after we removed `usePreventScreenRemoval` from the
//     recurring submit path (the user can navigate to the schedules
//     screen while a fill's `signBatch` fallback is mid-approve→swap and
//     trigger a cancel modal in between). With independent slots the
//     fill's second sign still reads its own fill context.
//   - Hooks claim the slot before the SDK call and release it in a
//     `finally`. Two concurrent invocations of the SAME action type (e.g.
//     two fills) would collide on a slot, but the UI prevents that with
//     `recurringSubmitting`/`pendingActionStore` gates.

export type RecurringFillPreview = {
  type: 'fill'
  fromTokenSymbol: string
  toTokenSymbol: string
  /** Pre-formatted display string (decimals applied) — RecurrenceDetails
   *  consumes it verbatim, so the side channel stays decimals-agnostic. */
  amountPerOrderFormatted: string
  numberOfOrders: number
  isUnlimited: boolean
  frequency: RecurringFrequency
}

export type RecurringOrderActionPreview = {
  type: 'cancel' | 'pause' | 'unpause'
  fromTokenSymbol: string
  toTokenSymbol: string
}

export type ActiveRecurringActionContext =
  | RecurringFillPreview
  | RecurringOrderActionPreview

export type RecurringActionType = ActiveRecurringActionContext['type']

// Per-type slots. The signer derives the type from the quote's
// `aggregator.id` and reads from the matching slot — concurrent flows of
// different types stay disjoint.
const slots: Map<RecurringActionType, ActiveRecurringActionContext> = new Map()

export function setActiveRecurringActionContext(
  ctx: ActiveRecurringActionContext
): void {
  slots.set(ctx.type, ctx)
}

/**
 * Reads the active context for the given SDK aggregator id. Returns
 * `undefined` when the aggregator id isn't a recurring marker or when
 * nothing has been stashed for that type.
 */
export function getActiveRecurringActionContext(
  aggregatorId: string | undefined
): ActiveRecurringActionContext | undefined {
  const type = aggregatorIdToActionType(aggregatorId)
  if (!type) return undefined
  return slots.get(type)
}

export function clearActiveRecurringActionContext(
  type: RecurringActionType
): void {
  slots.delete(type)
}

// `aggregator.id` values the SDK sets on its synthetic Quote for the
// recurring path:
//   - fill   → `markr-recurring`
//   - cancel → `markr-recurring-cancel`
//   - pause  → `markr-recurring-pause`
//   - unpause→ `markr-recurring-unpause`
// Source: @avalabs/fusion-sdk recurring `_namespace` module.
const RECURRING_AGGREGATOR_PREFIX = 'markr-recurring'

export function isRecurringAggregatorId(
  aggregatorId: string | undefined
): boolean {
  return (
    aggregatorId !== undefined &&
    aggregatorId.startsWith(RECURRING_AGGREGATOR_PREFIX)
  )
}

export function aggregatorIdToActionType(
  aggregatorId: string | undefined
): RecurringActionType | undefined {
  if (!aggregatorId) return undefined
  if (aggregatorId === 'markr-recurring') return 'fill'
  if (aggregatorId === 'markr-recurring-cancel') return 'cancel'
  if (aggregatorId === 'markr-recurring-pause') return 'pause'
  if (aggregatorId === 'markr-recurring-unpause') return 'unpause'
  return undefined
}
