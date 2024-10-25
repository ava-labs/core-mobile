import React from 'react'
import { BlurView } from '@react-native-community/blur'
import { View } from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform, useColorScheme } from 'react-native'

const TabBarBackground = (): JSX.Element => {
  const { bottom } = useSafeAreaInsets()
  const colorScheme = useColorScheme()

  return (
    <View sx={{ overflow: 'hidden' }}>
      <BlurView
        blurType={colorScheme === 'dark' ? 'dark' : 'xlight'}
        style={{ height: bottom + BOTTOM_TAB_BAR_HEIGHT }}
      />
    </View>
  )
}

const BOTTOM_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 45 : 50

export default TabBarBackground
