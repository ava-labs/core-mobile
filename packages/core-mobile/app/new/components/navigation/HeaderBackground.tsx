import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'
import BlurBackgroundView from '../BlurBackgroundView'

const HeaderBackground = (): JSX.Element => {
  const { top } = useSafeAreaInsets()

  return (
    <BlurBackgroundView
      sx={{
        height: top + HEADER_HEIGHT
      }}
    />
  )
}

const HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56

export default HeaderBackground
