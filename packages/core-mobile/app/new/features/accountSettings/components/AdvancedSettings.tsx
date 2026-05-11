import React from 'react'
import { GroupList } from '@avalabs/k2-alpine'
import { useQuickSwaps } from 'features/swap/hooks/useQuickSwaps'

export const AdvancedSettings = ({
  selectAdvancedSettings
}: {
  selectAdvancedSettings: () => void
}): React.JSX.Element | null => {
  const { flagOn } = useQuickSwaps()

  if (!flagOn) return null

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
