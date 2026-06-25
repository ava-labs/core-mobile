import {
  TransferSignatureReason,
  type RecurringFrequency,
  type TransferStepDetails
} from '@avalabs/fusion-sdk'
import type { RecurringOrderActionType } from '../store/pendingActionStore'

// Display metadata for an in-flight recurring action. Producers
// (`submitRecurringSwap`, the order-action hooks) pass this on the
// fusion-sdk `signerContext` field; the SDK forwards it unchanged onto
// `step.signerContext`, where `EvmSigner.signOne` reads it via
// `readRecurringSignerContext` and attaches it to the in-app approval
// request as `RequestContext.RECURRING_SWAP`. ApprovalScreen renders
// `<RecurrenceDetails />` from it above the standard tx details so the
// user sees what they're actually signing.
//
// The two payload shapes are structurally disjoint:
//   - fill carries `frequency`/`numberOfOrders`/`amountPerOrderFormatted`
//   - order action carries `action: RecurringOrderActionType` (the SDK
//     signature-reason enum value for Cancel/Pause/ResumeRecurringSwap)
//     and nothing else besides token symbols
// The approval-side schema is a `z.union` of the two strict shapes, so
// each payload still matches exactly one branch. Downstream consumers
// discriminate fill vs order action structurally (`'frequency' in ctx`),
// and pick the cancel/pause/resume copy off `ctx.action`.

export type RecurringFillSignerContext = {
  fromTokenSymbol: string
  toTokenSymbol: string
  /** Pre-formatted display string (decimals applied) — RecurrenceDetails
   *  consumes it verbatim, so this side channel stays decimals-agnostic. */
  amountPerOrderFormatted: string
  /** Wire value Markr signs: `RECURRING_UNLIMITED_ORDERS_SENTINEL` (`-1`)
   *  for Unlimited, or a finite count in [2, RECURRING_FREQUENCY_VALUE_MAX].
   *  Consumers derive "unlimited?" lazily from this sentinel — there is
   *  no separate boolean flag, so producer and consumer can't disagree. */
  numberOfOrders: number
  frequency: RecurringFrequency
}

export type RecurringOrderActionSignerContext = {
  /** Which schedule mutation the user is about to sign — drives the
   *  approval modal's title + body copy (cancel vs pause vs resume).
   *  Producer (`_makeOrderActionHook`) sets this from its own config. */
  action: RecurringOrderActionType
  fromTokenSymbol: string
  toTokenSymbol: string
}

export type RecurringSignerContext =
  | RecurringFillSignerContext
  | RecurringOrderActionSignerContext

export function isRecurringTransferSignatureReason(
  reason: TransferSignatureReason
): boolean {
  return (
    reason === TransferSignatureReason.ScheduleRecurringSwap ||
    reason === TransferSignatureReason.CancelRecurringSwap ||
    reason === TransferSignatureReason.PauseRecurringSwap ||
    reason === TransferSignatureReason.ResumeRecurringSwap
  )
}

// Reads the producer's payload off `step.signerContext` and forwards it
// verbatim. The approval-side Zod schema validates the structural shape
// (fill vs order-action) before rendering, so a malformed payload
// surfaces as `MalformedRecurringSwapContextError` rather than a
// half-rendered preview.
//
// Returns `undefined` when:
//   - the step's signature reason isn't one of the recurring ones
//     (defense-in-depth — also gated upstream), OR
//   - the producer payload is absent or not an object. Rejecting non-objects
//     here (rather than forwarding them for the downstream Zod schema to throw
//     on) keeps a malformed payload a graceful no-op: no RECURRING_SWAP context
//     is attached and the approval simply renders without the preview.
export function readRecurringSignerContext(
  step: TransferStepDetails
): RecurringSignerContext | undefined {
  if (!isRecurringTransferSignatureReason(step.currentSignatureReason))
    return undefined
  const value = step.signerContext
  if (!value || typeof value !== 'object') return undefined
  return value as RecurringSignerContext
}
