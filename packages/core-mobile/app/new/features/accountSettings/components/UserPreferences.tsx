import React from 'react'
import { GroupList } from '@avalabs/k2-alpine'

export const UserPreferences = ({
  selectSecurityPrivacy,
  selectNotificationPreferences
}: {
  selectSecurityPrivacy: () => void
  selectNotificationPreferences: () => void
}): React.JSX.Element => {
  const data = [
    {
      title: 'Security & privacy',
      onPress: selectSecurityPrivacy
    },
    {
      title: 'Notification preferences',
      onPress: selectNotificationPreferences
    }
  ]

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      separatorMarginRight={16}
    />
  )
}
