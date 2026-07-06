import {
  TransferSignatureReason,
  type TransferStepDetails
} from '@avalabs/fusion-sdk'
import {
  isRecurringOrderActionSignatureReason,
  isRecurringTransferSignatureReason,
  readRecurringSignerContext
} from './recurringSignerContext'

const makeStep = ({
  reason,
  signerContext
}: {
  reason: TransferSignatureReason
  signerContext: unknown
}): TransferStepDetails =>
  ({
    currentSignatureReason: reason,
    signerContext
  } as unknown as TransferStepDetails)

describe('isRecurringTransferSignatureReason', () => {
  // The four recurring-specific signature reasons the SDK emits on
  // `step.currentSignatureReason` for the Markr recurring path. Used by
  // EvmSigner to gate (a) attaching the `RECURRING_SWAP` context onto the
  // approval modal request, and (b) refusing the Quick Swaps batch
  // bypass so recurring fills always render the preview.
  it.each([
    TransferSignatureReason.ScheduleRecurringSwap,
    TransferSignatureReason.CancelRecurringSwap,
    TransferSignatureReason.PauseRecurringSwap,
    TransferSignatureReason.ResumeRecurringSwap
  ])('matches %s', reason => {
    expect(isRecurringTransferSignatureReason(reason)).toBe(true)
  })

  // AllowanceApproval is NOT recurring-specific (regular swaps approve
  // too) — gating off this would mislabel a plain-swap approve as
  // recurring. The Quick Swaps bypass therefore still applies on the
  // approve leg of a recurring first-fill, but `signOne`'s
  // `shouldAttachAutoApprove` already excludes approves regardless.
  it('does NOT match AllowanceApproval', () => {
    expect(
      isRecurringTransferSignatureReason(
        TransferSignatureReason.AllowanceApproval
      )
    ).toBe(false)
  })

  it.each([
    TransferSignatureReason.TokensTransfer,
    TransferSignatureReason.WrapToken,
    TransferSignatureReason.AddressOwnership,
    TransferSignatureReason.AvalancheCrossChainExport,
    TransferSignatureReason.HyperliquidAuthorize
  ])('does NOT match non-recurring reason %s', reason => {
    expect(isRecurringTransferSignatureReason(reason)).toBe(false)
  })
})

describe('isRecurringOrderActionSignatureReason', () => {
  // Cancel / pause / resume are the schedule-management actions EvmSigner
  // suppresses the success confetti for.
  it.each([
    TransferSignatureReason.CancelRecurringSwap,
    TransferSignatureReason.PauseRecurringSwap,
    TransferSignatureReason.ResumeRecurringSwap
  ])('matches %s', reason => {
    expect(isRecurringOrderActionSignatureReason(reason)).toBe(true)
  })

  // Creating a schedule is NOT an order action — it keeps its normal
  // confetti, so it must not match.
  it('does NOT match ScheduleRecurringSwap', () => {
    expect(
      isRecurringOrderActionSignatureReason(
        TransferSignatureReason.ScheduleRecurringSwap
      )
    ).toBe(false)
  })

  it.each([
    TransferSignatureReason.TokensTransfer,
    TransferSignatureReason.AllowanceApproval
  ])('does NOT match non-recurring reason %s', reason => {
    expect(isRecurringOrderActionSignatureReason(reason)).toBe(false)
  })
})

describe('readRecurringSignerContext', () => {
  it('returns undefined when the step reason is not a recurring one', () => {
    // Defense-in-depth: a non-recurring step that happens to carry a
    // signerContext object must never be surfaced as a recurring preview.
    expect(
      readRecurringSignerContext(
        makeStep({
          reason: TransferSignatureReason.TokensTransfer,
          signerContext: { fromTokenSymbol: 'A', toTokenSymbol: 'B' }
        })
      )
    ).toBeUndefined()
  })

  it('returns undefined on AllowanceApproval steps (approve leg of a recurring fill)', () => {
    // Even within the Markr recurring fill flow, the SDK emits
    // AllowanceApproval for the approve step before
    // ScheduleRecurringSwap. The approve modal renders generic approve
    // copy (no recurring preview) — the schedule preview appears on the
    // ScheduleRecurringSwap step that follows.
    expect(
      readRecurringSignerContext(
        makeStep({
          reason: TransferSignatureReason.AllowanceApproval,
          signerContext: {
            fromTokenSymbol: 'USDC',
            toTokenSymbol: 'AVAX',
            amountPerOrderFormatted: '1',
            numberOfOrders: 4,
            frequency: { unit: 'week', value: 1 }
          }
        })
      )
    ).toBeUndefined()
  })

  it('returns undefined when signerContext is absent or non-object', () => {
    const base = {
      reason: TransferSignatureReason.CancelRecurringSwap
    } as const
    expect(
      readRecurringSignerContext(
        makeStep({ ...base, signerContext: undefined })
      )
    ).toBeUndefined()
    expect(
      readRecurringSignerContext(makeStep({ ...base, signerContext: null }))
    ).toBeUndefined()
    expect(
      readRecurringSignerContext(makeStep({ ...base, signerContext: 'oops' }))
    ).toBeUndefined()
  })

  // Forwarded verbatim — the approval-side Zod schema is responsible for
  // validating the payload shape; this helper just narrows the SDK's
  // `unknown` and gates on the recurring signature reason.
  it('forwards a fill payload as-is on ScheduleRecurringSwap', () => {
    const payload = {
      fromTokenSymbol: 'USDC',
      toTokenSymbol: 'AVAX',
      amountPerOrderFormatted: '1',
      numberOfOrders: 4,
      frequency: { unit: 'week', value: 1 }
    }
    expect(
      readRecurringSignerContext(
        makeStep({
          reason: TransferSignatureReason.ScheduleRecurringSwap,
          signerContext: payload
        })
      )
    ).toEqual(payload)
  })

  // The producer payload's `action` field is the same SDK enum value as
  // the step's `currentSignatureReason` (the producer sources both from
  // its own `config.type`), so each row just uses one enum value twice.
  it.each([
    TransferSignatureReason.CancelRecurringSwap,
    TransferSignatureReason.PauseRecurringSwap,
    TransferSignatureReason.ResumeRecurringSwap
  ])('forwards an order-action payload as-is for action %s', reason => {
    const payload = {
      action: reason,
      fromTokenSymbol: 'USDC',
      toTokenSymbol: 'AVAX'
    }
    expect(
      readRecurringSignerContext(makeStep({ reason, signerContext: payload }))
    ).toEqual(payload)
  })
})
