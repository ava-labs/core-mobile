import { ActivityIndicator, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const WINDOW_HEIGHT = Dimensions.get('window').height

export const LoadingState = (): React.JSX.Element => {
  const safeArea = useSafeAreaInsets()
  return (
    <View
      sx={{
        height: WINDOW_HEIGHT - safeArea.top - safeArea.bottom,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }}>
      <ActivityIndicator size={'large'} />
    </View>
  )
}
