import { ActivityIndicator, SxProp, View } from '@avalabs/k2-alpine'
import React from 'react'

export const LoadingState = ({ sx }: { sx?: SxProp }): React.JSX.Element => {
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...sx
      }}>
      <ActivityIndicator size={'large'} />
    </View>
  )
}
