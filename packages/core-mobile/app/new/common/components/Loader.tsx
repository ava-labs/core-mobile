import React from 'react'
import { ActivityIndicator, SxProp, View } from '@avalabs/k2-alpine'

export const Loader = ({ sx }: { sx?: SxProp }): React.JSX.Element => {
  return (
    <View
      sx={{
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        ...sx
      }}>
      <ActivityIndicator size="small" />
    </View>
  )
}
