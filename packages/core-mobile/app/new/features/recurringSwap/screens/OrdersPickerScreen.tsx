import React, { useCallback, useState } from 'react'
import { Button, useTheme, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { DrumColumn } from '../components/DrumColumn'
import { useRecurringSwapContext } from '../contexts/RecurringSwapContext'
import { UNLIMITED_ORDERS } from '../types'

// ─── Constants ────────────────────────────────────────────────────────────────

// First option is "Unlimited" (sentinel = Infinity in context).
// Numeric options are 2–365 per Markr OpenAPI (minimum is 2).
const OPTIONS: string[] = [
  'Unlimited',
  ...Array.from({ length: 364 }, (_, i) => String(i + 2))
]

const DEFAULT_LABEL = '4'
const DEFAULT_INDEX = OPTIONS.indexOf(DEFAULT_LABEL) // 3

function labelToIndex(label: string): number {
  const idx = OPTIONS.indexOf(label)
  return idx >= 0 ? idx : DEFAULT_INDEX
}

function ordersToLabel(
  numberOfOrders: number | typeof UNLIMITED_ORDERS | undefined
): string {
  if (numberOfOrders === UNLIMITED_ORDERS) return 'Unlimited'
  if (numberOfOrders !== undefined) return String(numberOfOrders)
  return DEFAULT_LABEL
}

// ─── OrdersPickerScreen ───────────────────────────────────────────────────────

export function OrdersPickerScreen(): JSX.Element {
  const router = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const { numberOfOrders, setNumberOfOrders } = useRecurringSwapContext()

  const initialLabel = ordersToLabel(numberOfOrders)
  const [selectedIndex, setSelectedIndex] = useState<number>(
    labelToIndex(initialLabel)
  )

  const handleConfirm = useCallback(() => {
    const label = OPTIONS[selectedIndex] ?? DEFAULT_LABEL
    setNumberOfOrders(label === 'Unlimited' ? UNLIMITED_ORDERS : Number(label))
    router.back()
  }, [selectedIndex, setNumberOfOrders, router])

  return (
    <ScrollScreen
      title="Number of orders"
      navigationTitle="Number of orders"
      isModal
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ marginTop: 24 }}>
        <View
          sx={{
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: colors.$surfacePrimary
          }}>
          <DrumColumn
            items={OPTIONS}
            selectedIndex={selectedIndex}
            onIndexChange={setSelectedIndex}
          />
        </View>
      </View>
      <View sx={{ marginTop: 24 }}>
        <Button type="primary" size="large" onPress={handleConfirm}>
          Confirm
        </Button>
      </View>
    </ScrollScreen>
  )
}
