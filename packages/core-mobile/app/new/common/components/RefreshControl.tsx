import { useTheme } from '@avalabs/k2-alpine'
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
  const {
    theme: { colors }
  } = useTheme()
  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // ios props
      tintColor={colors.$textSecondary}
      {...props}
    />
  )
}
