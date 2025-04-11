import React from 'react'
import { ActivityIndicator, View } from '@avalabs/k2-alpine'

export const Loader = (): React.JSX.Element => {
  return (
    <View
      sx={{
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <ActivityIndicator size="small" />
    </View>
  )
}
