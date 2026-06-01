import React, { useCallback, useMemo } from 'react'
import {
  Button,
  GroupList,
  GroupListItem,
  showAlert,
  Text,
  View
} from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network/slice'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useRecurringSchedules } from '../hooks/useRecurringSchedules'
import { useCancelRecurringSchedule } from '../hooks/useCancelRecurringSchedule'
import { formatFrequencyShort } from '../utils/formatFrequency'
import type { Schedule, ScheduleStatus } from '../types'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

function formatUnixDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString()
}

/**
 * Formats the per-schedule summary line shown in the card.
 *
 * NOTE: `tokenIn`/`tokenOut` on the Schedule wire type are EVM addresses, not
 * symbols. Client-side symbol resolution against the active token list is
 * deferred to a future iteration — for now we display the truncated address.
 */
function formatSummary(s: Schedule): string {
  const cadence = formatFrequencyShort(s.frequency)
  const tokenInLabel = shortenAddress(s.tokenIn)
  const tokenOutLabel = shortenAddress(s.tokenOut)
  const ordersClause =
    s.numberOfOrders === 365
      ? 'for an unlimited amount of time'
      : s.numberOfOrders === 1
      ? 'for 1 order'
      : `for ${s.numberOfOrders} orders`
  return `${s.amount} ${tokenInLabel} swapped for ${tokenOutLabel} every ${cadence}, ${ordersClause}`
}

function shortenAddress(addr: string): string {
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const STATUS_ORDER: ScheduleStatus[] = ['active', 'paused', 'completed', 'cancelled']

function sortSchedules(schedules: Schedule[]): Schedule[] {
  return [...schedules].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: single schedule card
// ─────────────────────────────────────────────────────────────────────────────

type ScheduleCardProps = {
  schedule: Schedule
  onRemove: (s: Schedule) => void
}

function ScheduleCard({ schedule: s, onRemove }: ScheduleCardProps): JSX.Element {
  const isActionable = s.status === 'active' || s.status === 'paused'

  const groupData = useMemo((): GroupListItem[] => {
    const items: GroupListItem[] = [
      {
        title: 'Orders executed',
        value: `${s.executedOrders} / ${s.numberOfOrders === 365 ? '∞' : s.numberOfOrders}`
      },
      {
        title: 'Next swap scheduled',
        value:
          s.nextExecutionAt !== null && s.nextExecutionAt !== undefined
            ? formatUnixDate(s.nextExecutionAt)
            : '—'
      }
    ]
    if (s.failures.length > 0) {
      items.push({
        title: 'Failed attempts',
        value: String(s.failures.length)
      })
    }
    return items
  }, [s])

  return (
    <View
      sx={{
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        gap: 12
      }}>
      {s.status !== 'active' && (
        <View
          sx={{
            alignSelf: 'flex-start',
            backgroundColor: '$surfacePrimary',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 2
          }}>
          <Text variant="caption" sx={{ color: '$textSecondary' }}>
            {STATUS_LABEL[s.status]}
          </Text>
        </View>
      )}

      <Text
        variant="body2"
        sx={{ color: '$textPrimary', textAlign: 'center' }}>
        {formatSummary(s)}
      </Text>

      <GroupList data={groupData} separatorMarginRight={16} />

      {isActionable && (
        <Button
          type="secondary"
          size="medium"
          onPress={() => onRemove(s)}>
          Remove recurrence
        </Button>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export function RecurringSchedulesScreen(): JSX.Element {
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const chainId = activeNetwork?.chainId

  const { data: schedules, isLoading } = useRecurringSchedules(
    activeAccount?.addressC,
    chainId
  )

  const cancel = useCancelRecurringSchedule()

  const sorted = useMemo(
    () => (schedules ? sortSchedules(schedules) : []),
    [schedules]
  )

  const activeCount = useMemo(
    () =>
      schedules?.filter(
        s => s.status === 'active' || s.status === 'paused'
      ).length ?? 0,
    [schedules]
  )

  const handleRemove = useCallback(
    (s: Schedule) => {
      showAlert({
        title: 'Are you sure you want to remove this recurring swap?',
        description: 'This action cannot be undone.',
        buttons: [
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              cancel.mutate({
                orderId: s.orderId,
                address: s.owner
              })
              AnalyticsService.capture('RecurringSwapCancelledByUser', {
                orderId: s.orderId,
                chainId: s.chainId
              })
            }
          },
          {
            text: 'Cancel',
            style: 'default'
          }
        ]
      })
    },
    [cancel]
  )

  const title = `${activeCount} recurring swap${activeCount === 1 ? '' : 's'} scheduled`

  return (
    <ScrollScreen
      title="Swap"
      navigationTitle={title}
      isModal
      contentContainerStyle={{ padding: 16 }}>
      {isLoading && (
        <View sx={{ alignItems: 'center', paddingTop: 32 }}>
          <Text variant="body2" sx={{ color: '$textSecondary' }}>
            Loading…
          </Text>
        </View>
      )}
      {!isLoading && sorted.length === 0 && (
        <View sx={{ alignItems: 'center', paddingTop: 32 }}>
          <Text variant="body2" sx={{ color: '$textSecondary' }}>
            No recurring swaps found.
          </Text>
        </View>
      )}
      {sorted.map(s => (
        <ScheduleCard key={s.orderId} schedule={s} onRemove={handleRemove} />
      ))}
    </ScrollScreen>
  )
}
