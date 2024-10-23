import React from 'react'
import { BlurView } from '@react-native-community/blur'
import { View } from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'

const TabBarBackground = (): JSX.Element => {
  const { bottom } = useSafeAreaInsets()

  return (
    <View sx={{ overflow: 'hidden' }}>
      <BlurView
        blurType="xlight"
        style={{ height: bottom + BOTTOM_TAB_BAR_HEIGHT }}
      />
    </View>
  )
}

const BOTTOM_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 45 : 50

export default TabBarBackground
