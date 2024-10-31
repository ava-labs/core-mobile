import React from 'react'
import { useColorScheme } from 'react-native'
import { GlassView } from '@avalabs/k2-alpine'

const BlurredBackgroundView = (): JSX.Element => {
  const colorScheme = useColorScheme()

  return (
    <GlassView
      style={{ flex: 1 }}
      glassType={colorScheme === 'dark' ? 'dark' : 'light'}
    />
  )
}

export default BlurredBackgroundView
