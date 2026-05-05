import React from 'react'
import { GroupList } from '@avalabs/k2-alpine'
import { useQuickSwaps } from 'features/swap/hooks/useQuickSwaps'

export const UserPreferences = ({
  selectSecurityPrivacy,
  selectNotificationPreferences,
  selectAdvancedSettings
}: {
  selectSecurityPrivacy: () => void
  selectNotificationPreferences: () => void
  selectAdvancedSettings: () => void
}): React.JSX.Element => {
  const { isAvailable: isQuickSwapsAvailable } = useQuickSwaps()

  const data = [
    {
      title: 'Security & privacy',
      onPress: selectSecurityPrivacy
    },
    {
      title: 'Notification preferences',
      onPress: selectNotificationPreferences
    },
    ...(isQuickSwapsAvailable
      ? [
          {
            title: 'Advanced',
            onPress: selectAdvancedSettings
          }
        ]
      : [])
  ]

  return (
    <GroupList
      data={data}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      separatorMarginRight={16}
    />
  )
}
