import { ActivityIndicator, View } from '@avalabs/k2-alpine'
import React from 'react'

export const GlobalLoadingState = (): React.JSX.Element => {
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
      <ActivityIndicator size={'large'} />
    </View>
  )
}
