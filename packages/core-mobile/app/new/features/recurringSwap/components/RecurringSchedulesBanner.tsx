import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import {
  getListItemEnteringAnimation,
  getListItemExitingAnimation
} from 'common/utils/animations'
import { useRouter } from 'expo-router'
import React, { memo } from 'react'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network/slice'
import { selectIsRecurringSwapsBlocked } from 'store/posthog'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { RecurringOrderStatus } from '../types'

// `memo` because this is rendered inside ActivityScreen's `renderHeader`
// callback. When ActivityScreen re-renders (filter, network, search change)
// renderHeader returns a fresh JSX instance, which without `memo` mounts
// a new RecurringSchedulesBanner subtree and re-runs `useRecurringSchedules`
// on every parent render.
function RecurringSchedulesBannerImpl(): JSX.Element | null {
  const router = useRouter()
  const {
    theme: { colors }
  } = useTheme()
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
    schedules?.filter(
      s =>
        s.status === RecurringOrderStatus.Active ||
        s.status === RecurringOrderStatus.Paused
    ).length ?? 0

  if (count === 0) return null

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      exiting={getListItemExitingAnimation(0)}>
      <View
        sx={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: '$surfaceSecondary',
          borderRadius: 18,
          paddingVertical: 16,
          paddingHorizontal: 12
        }}>
        <Icons.Notification.RotateRight
          width={24}
          height={24}
          color={colors.$textPrimary}
        />
        <View sx={{ flex: 1 }}>
          <Text
            variant="subtitle2"
            sx={{ fontFamily: 'Inter-SemiBold', color: '$textPrimary' }}>
            Recurring swaps
          </Text>
          <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
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
    </Animated.View>
  )
}

export const RecurringSchedulesBanner = memo(RecurringSchedulesBannerImpl)
