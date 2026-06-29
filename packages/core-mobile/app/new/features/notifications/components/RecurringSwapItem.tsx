import React, { FC, useMemo } from 'react'
import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { AppNotification, isRecurringSwapNotification } from '../types'
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
// so the row just renders those verbatim. The `data.status` field is used
// only to drive the colored status badge under the subtitle — that's the
// one piece of UI we can synthesize client-side without lossy formatting.
//
// Status → badge mapping (matches the Figma design):
//   - 'failed'                → red "Failed"
//   - 'active' / 'completed'  → green "Completed"   (a fill landed; either a
//                                                    mid-schedule leg or the
//                                                    final one — both are
//                                                    surfaced the same way)
//   - anything else           → no badge
type BadgeKind = 'success' | 'failure' | null

function resolveBadgeKind(status: string | undefined): BadgeKind {
  if (status === undefined) return null
  const lower = status.toLowerCase()
  if (lower === 'failed') return 'failure'
  if (lower === 'active' || lower === 'completed' || lower === 'executed') {
    return 'success'
  }
  return null
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

  const badgeKind = useMemo(
    () =>
      isRecurringSwapNotification(notification)
        ? resolveBadgeKind(notification.data?.status)
        : null,
    [notification]
  )

  // Subtitle = backend-formatted body + optional colored status line. Wrapping
  // in a View (rather than passing a string) lets NotificationListItem render
  // both lines without us re-implementing its typography defaults.
  const subtitle = useMemo<React.ReactNode>(() => {
    if (badgeKind === null) return notification.body
    const badgeColor =
      badgeKind === 'failure' ? colors.$textDanger : colors.$textSuccess
    const badgeLabel = badgeKind === 'failure' ? 'Failed' : 'Completed'
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
          {badgeLabel}
        </Text>
      </View>
    )
  }, [badgeKind, notification.body, colors.$textDanger, colors.$textSuccess])

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
