import React from 'react'
import { Text, View } from '@avalabs/k2-alpine'
import {
  RECURRING_UNLIMITED_ORDERS_SENTINEL,
  TransferSignatureReason
} from '@avalabs/fusion-sdk'
import type { RecurringSwapApprovalContext } from 'vmModule/ApprovalController/validators/shared'
import { formatFrequencyShort } from 'features/recurringSwap/utils/formatFrequency'

type Props = {
  context: RecurringSwapApprovalContext
}

// Copy + headline for each non-fill recurring action. The fill variant has
// its own richer summary built below. Keyed by the SDK's signature-reason
// enum value so it lines up with the producer payload (Zod-validated).
const ORDER_ACTION_COPY = {
  [TransferSignatureReason.CancelRecurringSwap]: {
    title: 'Cancelling recurring swap',
    body: (from: string, to: string): string =>
      `Stops the recurring ${from} → ${to} schedule. ` +
      `The schedule may still execute one more fill until this transaction confirms on-chain.`
  },
  [TransferSignatureReason.PauseRecurringSwap]: {
    title: 'Pausing recurring swap',
    body: (from: string, to: string): string =>
      `Pauses the recurring ${from} → ${to} schedule. ` +
      `Existing allowance is preserved — you can resume later without re-approving. ` +
      `The schedule may still execute one more fill until this transaction confirms on-chain.`
  },
  [TransferSignatureReason.ResumeRecurringSwap]: {
    title: 'Resuming recurring swap',
    body: (from: string, to: string): string =>
      `Resumes the recurring ${from} → ${to} schedule. ` +
      `Remaining fills will execute on the original cadence once this transaction confirms on-chain.`
  }
} as const

// Fill payloads carry `frequency`/`numberOfOrders`/`amountPerOrderFormatted`;
// order-action payloads don't. The structural check both narrows TS and
// matches the runtime shape Zod parses, so we don't need a `type`
// discriminator on either schema.
const isFillContext = (
  context: RecurringSwapApprovalContext
): context is Extract<RecurringSwapApprovalContext, { frequency: unknown }> =>
  'frequency' in context

export function RecurrenceDetails({ context }: Props): JSX.Element {
  if (!isFillContext(context)) {
    const copy = ORDER_ACTION_COPY[context.action]
    return (
      <View
        sx={{
          padding: 16,
          backgroundColor: '$surfaceSecondary',
          borderRadius: 12
        }}>
        <Text
          variant="body1"
          sx={{ fontFamily: 'Inter-SemiBold', marginBottom: 4 }}>
          {copy.title}
        </Text>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          {copy.body(context.fromTokenSymbol, context.toTokenSymbol)}
        </Text>
      </View>
    )
  }

  // Full schedule preview matching the Figma frame (`21654-62903`). The
  // hook pre-formats `amountPerOrderFormatted` so the ApprovalScreen side
  // stays decimals-agnostic.
  //
  // `RECURRING_UNLIMITED_ORDERS_SENTINEL` (`-1`) is the wire value Markr
  // signs for Unlimited schedules. Derived inline so producer + preview
  // can't disagree on a separate boolean.
  const ordersClause =
    context.numberOfOrders === RECURRING_UNLIMITED_ORDERS_SENTINEL
      ? 'for an unlimited amount of time'
      : `for ${context.numberOfOrders} orders`

  // Reuse the canonical short-form frequency formatter from
  // `recurringSwap/utils/formatFrequency` so this preview stays in sync
  // with the manage screen's row summary (also `formatFrequencyShort`)
  // and the picker's `formatFrequency`. Singular form is "week" (not
  // "1 week"), which reads more naturally inside "every {…}, for N orders".
  const summary =
    `You will swap ${context.amountPerOrderFormatted} ${context.fromTokenSymbol} for ${context.toTokenSymbol} ` +
    `every ${formatFrequencyShort(context.frequency)}, ${ordersClause}. ` +
    `First swap executes immediately after approval. ` +
    `Each swap requires sufficient balance, otherwise the swap will fail.`

  return (
    <View
      sx={{
        padding: 12,
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12
      }}>
      <Text variant="body1" sx={{ fontSize: 16, lineHeight: 22 }}>
        Scheduling recurring swap
      </Text>
      <Text
        variant="caption"
        sx={{ fontSize: 13, lineHeight: 16, color: '$textSecondary' }}>
        {summary}
      </Text>
    </View>
  )
}
