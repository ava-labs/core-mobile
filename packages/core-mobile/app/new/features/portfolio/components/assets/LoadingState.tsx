import { ActivityIndicator, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Dimensions } from 'react-native'
import { SEGMENT_CONTROL_HEIGHT } from './consts'

const WINDOW_HEIGHT = Dimensions.get('window').height

export const LoadingState = (): React.JSX.Element => {
  return (
    <View
      sx={{
        height: WINDOW_HEIGHT / 2 - SEGMENT_CONTROL_HEIGHT - 16, // 16 bottom padding
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <ActivityIndicator size={'large'} />
    </View>
  )
}
