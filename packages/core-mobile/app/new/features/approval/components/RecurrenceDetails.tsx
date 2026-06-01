import React from 'react'
import { Text, View } from '@avalabs/k2-alpine'
import type { RecurringSwapApprovalContext } from 'store/rpc/types'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { formatTokenAmount } from 'utils/Utils'

type Props = {
  context: RecurringSwapApprovalContext
}

const unitToLabel = (unit: string, value: number): string =>
  `${value} ${unit}${value === 1 ? '' : 's'}`

export function RecurrenceDetails({ context }: Props): JSX.Element {
  const amountFormatted = formatTokenAmount(
    bigintToBig(BigInt(context.amountPerOrder), context.fromTokenDecimals)
  )

  const ordersClause = context.isUnlimited
    ? 'for an unlimited amount of time'
    : `for ${context.numberOfOrders} orders`

  const summary =
    `You will swap ${amountFormatted} ${context.fromTokenSymbol} for ${context.toTokenSymbol} ` +
    `every ${unitToLabel(context.frequency.unit, context.frequency.value)}, ${ordersClause}. ` +
    `First swap executes immediately after approval. ` +
    `Each swap requires sufficient balance, otherwise the swap will fail.`

  return (
    <View
      sx={{ padding: 16, backgroundColor: '$surfaceSecondary', borderRadius: 12 }}>
      <Text variant="body1" sx={{ fontWeight: 'semibold', marginBottom: 4 }}>
        Scheduling recurring swap
      </Text>
      <Text variant="caption" sx={{ color: '$textSecondary' }}>
        {summary}
      </Text>
    </View>
  )
}
