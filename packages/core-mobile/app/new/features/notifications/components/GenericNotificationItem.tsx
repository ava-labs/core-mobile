import React, { FC } from 'react'
import { AppNotification } from '../types'
import NotificationListItem from './NotificationListItem'
import NotificationIcon from './NotificationIcon'

type GenericNotificationItemProps = {
  notification: AppNotification
  showSeparator: boolean
  accessoryType: 'chevron' | 'none'
  testID?: string
}

const GenericNotificationItem: FC<GenericNotificationItemProps> = ({
  notification,
  showSeparator,
  accessoryType,
  testID
}) => {
  return (
    <NotificationListItem
      title={notification.title}
      subtitle={notification.body}
      icon={<NotificationIcon notification={notification} />}
      timestamp={notification.timestamp}
      showSeparator={showSeparator}
      accessoryType={accessoryType}
      testID={testID}
    />
  )
}

export default GenericNotificationItem
