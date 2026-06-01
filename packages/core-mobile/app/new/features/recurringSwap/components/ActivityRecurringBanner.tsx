import { Button, Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network/slice'
import { selectIsRecurringSwapsBlocked } from 'store/posthog'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'

export function ActivityRecurringBanner(): JSX.Element | null {
  const router = useRouter()
  const isBlocked = useSelector(selectIsRecurringSwapsBlocked)
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const chainId = activeNetwork?.chainId
  const { data: schedules } = useRecurringSchedules(
    activeAccount?.addressC,
    chainId
  )

  if (isBlocked) return null

  const count =
    schedules?.filter(s => s.status === 'active' || s.status === 'paused')
      .length ?? 0

  if (count === 0) return null

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '$surfaceSecondary',
        borderRadius: 18,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 12
      }}>
      <View sx={{ flex: 1 }}>
        <Text variant="body1" sx={{ fontWeight: 'semibold' }}>
          Recurring swaps
        </Text>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          {count} scheduled
        </Text>
      </View>
      <Button
        type="secondary"
        size="small"
        onPress={() => router.navigate('/swap/recurring/schedules')}>
        Manage
      </Button>
    </View>
  )
}
