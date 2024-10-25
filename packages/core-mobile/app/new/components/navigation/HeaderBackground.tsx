import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from '@react-native-community/blur'
import { View } from '@avalabs/k2-alpine'
import { Platform, useColorScheme } from 'react-native'

const HeaderBackground = (): JSX.Element => {
  const { top } = useSafeAreaInsets()
  const colorScheme = useColorScheme()

  return (
    <View sx={{ overflow: 'hidden', backgroundColor: 'transparent' }}>
      <BlurView
        blurType={colorScheme === 'dark' ? 'dark' : 'xlight'}
        style={{ height: top + HEADER_HEIGHT }}
      />
    </View>
  )
}

const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56

export default HeaderBackground
