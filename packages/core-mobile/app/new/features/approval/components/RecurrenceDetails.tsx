import React from 'react'
import { Text, View } from '@avalabs/k2-alpine'
import type { RecurringSwapApprovalContext } from 'vmModule/ApprovalController/validators/shared'

type Props = {
  context: RecurringSwapApprovalContext
}

const unitToLabel = (unit: string, value: number): string =>
  `${value} ${unit}${value === 1 ? '' : 's'}`

// Copy + headline for each non-fill recurring action. The fill variant has
// its own richer summary built below.
const ORDER_ACTION_COPY = {
  cancel: {
    title: 'Cancelling recurring swap',
    body: (from: string, to: string): string =>
      `Stops the recurring ${from} → ${to} schedule. ` +
      `The schedule remains active and may execute one more fill until this transaction confirms on-chain.`
  },
  pause: {
    title: 'Pausing recurring swap',
    body: (from: string, to: string): string =>
      `Pauses the recurring ${from} → ${to} schedule. ` +
      `Existing allowance is preserved — you can unpause later without re-approving. ` +
      `The schedule keeps running until this transaction confirms on-chain.`
  },
  unpause: {
    title: 'Unpausing recurring swap',
    body: (from: string, to: string): string =>
      `Resumes the recurring ${from} → ${to} schedule. ` +
      `Remaining fills will execute on the original cadence once this transaction confirms on-chain.`
  }
} as const

export function RecurrenceDetails({ context }: Props): JSX.Element {
  if (
    context.type === 'cancel' ||
    context.type === 'pause' ||
    context.type === 'unpause'
  ) {
    const copy = ORDER_ACTION_COPY[context.type]
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

  // type === 'fill' — full schedule preview matching the Figma frame
  // (`21654-62903`). The hook pre-formats `amountPerOrderFormatted` so the
  // ApprovalScreen side stays decimals-agnostic. Explicit narrow keeps TS
  // happy across the discriminated-union branch above.
  if (context.type !== 'fill') return <></>

  const ordersClause = context.isUnlimited
    ? 'for an unlimited amount of time'
    : `for ${context.numberOfOrders} orders`

  const summary =
    `You will swap ${context.amountPerOrderFormatted} ${context.fromTokenSymbol} for ${context.toTokenSymbol} ` +
    `every ${unitToLabel(
      context.frequency.unit,
      context.frequency.value
    )}, ${ordersClause}. ` +
    `First swap executes immediately after approval. ` +
    `Each swap requires sufficient balance, otherwise the swap will fail.`

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
        Scheduling recurring swap
      </Text>
      <Text variant="caption" sx={{ color: '$textSecondary' }}>
        {summary}
      </Text>
    </View>
  )
}
