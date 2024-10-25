import { BlurView } from '@react-native-community/blur'
import React from 'react'
import { View, Sx } from '@avalabs/k2-alpine'
import { useColorScheme } from 'react-native'

const BlurBackgroundView = ({ sx }: { sx: Sx }): JSX.Element => {
  const colorScheme = useColorScheme()

  return (
    <View sx={{ ...sx, overflow: 'hidden', backgroundColor: 'transparent' }}>
      <BlurView
        style={{ flex: 1 }}
        blurType={colorScheme === 'dark' ? 'dark' : 'xlight'}
      />
    </View>
  )
}

export default BlurBackgroundView
