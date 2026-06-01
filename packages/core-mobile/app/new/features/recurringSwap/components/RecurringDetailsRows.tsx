import React, { useMemo } from 'react'
import { GroupList, GroupListItem, Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { useRecurringSwapContext } from '../contexts/RecurringSwapContext'
import { formatFrequency, formatFrequencyShort } from '../utils/formatFrequency'
import type { NumberOfOrders } from '../types'
import { UNLIMITED_ORDERS } from '../types'

const formatOrders = (n: NumberOfOrders | undefined): string => {
  if (n === undefined) return 'Set'
  if (n === UNLIMITED_ORDERS) return 'Unlimited'
  return n === 1 ? '1 order' : `${n} orders`
}

type Props = {
  amountPerOrder: string | undefined
  fromTokenSymbol: string | undefined
  toTokenSymbol: string | undefined
  fromTokenDecimals: number | undefined
}

export function RecurringDetailsRows({
  amountPerOrder,
  fromTokenSymbol,
  toTokenSymbol,
  fromTokenDecimals
}: Props): JSX.Element {
  const router = useRouter()
  const { frequency, numberOfOrders } = useRecurringSwapContext()

  const summary = useMemo(() => {
    if (
      !frequency ||
      numberOfOrders === undefined ||
      !amountPerOrder ||
      !fromTokenSymbol ||
      !toTokenSymbol
    ) {
      return null
    }
    const cadence = formatFrequencyShort(frequency)
    const ordersClause =
      numberOfOrders === UNLIMITED_ORDERS
        ? 'for an unlimited amount of time'
        : numberOfOrders === 1
          ? 'for 1 order'
          : `for ${numberOfOrders} orders`
    return (
      `You will swap ${amountPerOrder} ${fromTokenSymbol} for ${toTokenSymbol} every ${cadence}, ` +
      `${ordersClause}. ` +
      `First swap executes immediately after approval. ` +
      `Each swap requires sufficient balance, otherwise the swap will fail.`
    )
  }, [frequency, numberOfOrders, amountPerOrder, fromTokenSymbol, toTokenSymbol])

  // Estimated total spend = amountPerOrder × N.
  // Suppressed when Unlimited per Figma.
  const totalSpend = useMemo(() => {
    if (
      !amountPerOrder ||
      numberOfOrders === undefined ||
      numberOfOrders === UNLIMITED_ORDERS ||
      !fromTokenSymbol
    ) {
      return null
    }
    const n = parseFloat(amountPerOrder) * (numberOfOrders as number)
    const decimals = Math.min(fromTokenDecimals ?? 2, 6)
    const truncated = Number.isFinite(n) ? n.toFixed(decimals) : amountPerOrder
    return `${truncated} ${fromTokenSymbol}`
  }, [amountPerOrder, numberOfOrders, fromTokenSymbol, fromTokenDecimals])

  const data = useMemo((): GroupListItem[] => {
    const items: GroupListItem[] = [
      {
        title: 'Frequency',
        value: formatFrequency(frequency),
        onPress: () => router.navigate('/swap/recurring/frequency')
      },
      {
        title: 'Number of orders',
        value: formatOrders(numberOfOrders),
        onPress: () => router.navigate('/swap/recurring/orders')
      }
    ]
    if (totalSpend) {
      items.push({
        title: 'Estimated total spend',
        value: totalSpend
      })
    }
    return items
  }, [frequency, numberOfOrders, totalSpend, router])

  return (
    <View sx={{ marginTop: 8 }}>
      <GroupList data={data} separatorMarginRight={16} />
      {summary && (
        <View sx={{ paddingHorizontal: 4, marginTop: 12 }}>
          <Text variant="body2" sx={{ color: '$textSecondary' }}>
            {summary}
          </Text>
        </View>
      )}
    </View>
  )
}
