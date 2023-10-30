import { useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import { RefreshControl as RNRefreshControl } from 'react-native'

type Props = {
  refreshing: boolean
  onRefresh: () => void
}

export const RefreshControl: React.FC<Props> = ({
  refreshing,
  onRefresh,
  ...props
}) => {
  const { theme } = useApplicationContext()
  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // ios props
      tintColor={theme.colorPrimary1}
      {...props}
    />
  )
}
