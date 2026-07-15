import React, { FC, useMemo } from 'react'
import { Text, useTheme, View } from '@avalabs/k2-alpine'
import {
  AppNotification,
  isRecurringSwapNotification,
  RecurringSwapMetadata
} from '../types'
import { classifyRecurringSwapStatus } from '../utils'
import NotificationListItem from './NotificationListItem'
import NotificationIcon from './NotificationIcon'

type RecurringSwapItemProps = {
  notification: AppNotification
  showSeparator: boolean
  accessoryType: 'chevron' | 'none'
  testID?: string
}

// Per Sarp's PR #174 the notification-sender service formats the push
// envelope's `title` + `body` server-side (e.g. "Recurring swap executed",
// "Insufficient balance — your recurring swap schedule will be cancelled"),
// so the row just renders those verbatim. The machine-readable `data` block
// drives the colored status badge under the subtitle — the one piece of UI we
// synthesize client-side without lossy formatting.
//
// We read the structured `data` fields (NOT the human-facing copy) to tell a
// mid-schedule fill apart from the final leg:
//   - 'failed'                       → red "Failed"
//   - final leg                      → green "Completed"
//       (`status === 'completed'`, or — for finite schedules — no fills left)
//   - other success fill             → green "Executed"
//       (a mid-schedule leg landed; infinite/DCA schedules never "complete",
//        so they always read here)
//   - anything else                  → no badge
type Badge = { kind: 'success' | 'failure'; label: string } | null

function resolveBadge(data: RecurringSwapMetadata | undefined): Badge {
  if (data === undefined) return null
  // Shared classifier (see notifications/utils.ts) so the badge stays in lockstep
  // with `isTerminalRecurringSwapNotification`'s row-actionability logic.
  const kind = classifyRecurringSwapStatus(data.status)
  if (kind === 'failed') return { kind: 'failure', label: 'Failed' }

  // Only success fills get a badge; 'cancelled' and unrecognized statuses show
  // none (a cancelled schedule was deliberately stopped, not a fill event).
  if (kind !== 'completed' && kind !== 'fill') return null

  // The schedule is finished when the backend marks it completed, or — for
  // finite schedules — when no fills remain. Infinite/DCA schedules
  // (numberOfOrders === -1) never reach a completed terminal, so they always
  // read as a mid-schedule fill.
  const isFinalLeg =
    kind === 'completed' ||
    (data.numberOfOrders !== undefined &&
      data.remainingOrders !== undefined &&
      data.numberOfOrders !== -1 &&
      data.remainingOrders === 0)
  return { kind: 'success', label: isFinalLeg ? 'Completed' : 'Executed' }
}

const RecurringSwapItem: FC<RecurringSwapItemProps> = ({
  notification,
  showSeparator,
  accessoryType,
  testID
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const badge = useMemo(
    () =>
      isRecurringSwapNotification(notification)
        ? resolveBadge(notification.data)
        : null,
    [notification]
  )

  // Subtitle = backend-formatted body + optional colored status line. Wrapping
  // in a View (rather than passing a string) lets NotificationListItem render
  // both lines without us re-implementing its typography defaults.
  const subtitle = useMemo<React.ReactNode>(() => {
    if (badge === null) return notification.body
    const badgeColor =
      badge.kind === 'failure' ? colors.$textDanger : colors.$textSuccess
    return (
      <View sx={{ gap: 2 }}>
        <Text
          variant="body2"
          numberOfLines={2}
          ellipsizeMode="tail"
          sx={{ color: '$textSecondary' }}>
          {notification.body}
        </Text>
        <Text variant="body2" sx={{ color: badgeColor }}>
          {badge.label}
        </Text>
      </View>
    )
  }, [badge, notification.body, colors.$textDanger, colors.$textSuccess])

  return (
    <NotificationListItem
      title={notification.title}
      subtitle={subtitle}
      icon={<NotificationIcon notification={notification} />}
      timestamp={notification.timestamp}
      showSeparator={showSeparator}
      accessoryType={accessoryType}
      testID={testID}
    />
  )
}

export default RecurringSwapItem
