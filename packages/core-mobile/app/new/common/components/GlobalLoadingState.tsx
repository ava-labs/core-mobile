import { ActivityIndicator, View } from '@avalabs/k2-alpine'
import React from 'react'

export const GlobalLoadingState = (): React.JSX.Element => {
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1
      }}>
      <ActivityIndicator size={'large'} />
    </View>
  )
}
