import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from '@react-native-community/blur'
import { View } from '@avalabs/k2-alpine'
import { Platform } from 'react-native'

const HeaderBackground = (): JSX.Element => {
  const { top } = useSafeAreaInsets()

  return (
    <View sx={{ overflow: 'hidden' }}>
      <BlurView blurType="xlight" style={{ height: top + HEADER_HEIGHT }} />
    </View>
  )
}

const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56

export default HeaderBackground
