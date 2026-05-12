import React from 'react'
import { GroupList } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectIsAdvancedSettingsAvailable } from 'store/posthog'

export const AdvancedSettings = ({
  selectAdvancedSettings
}: {
  selectAdvancedSettings: () => void
}): React.JSX.Element | null => {
  const isAvailable = useSelector(selectIsAdvancedSettingsAvailable)

  if (!isAvailable) return null

  return (
    <GroupList
      data={[
        {
          title: 'Advanced settings',
          onPress: selectAdvancedSettings
        }
      ]}
      titleSx={{ fontSize: 16, lineHeight: 22, fontFamily: 'Inter-Regular' }}
      separatorMarginRight={16}
    />
  )
}
