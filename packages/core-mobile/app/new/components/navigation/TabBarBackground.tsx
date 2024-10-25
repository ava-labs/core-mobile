import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'
import BlurBackgroundView from '../BlurBackgroundView'

const TabBarBackground = (): JSX.Element => {
  const { bottom } = useSafeAreaInsets()

  return (
    <BlurBackgroundView
      sx={{
        height: bottom + BOTTOM_TAB_BAR_HEIGHT
      }}
    />
  )
}

const BOTTOM_TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 45 : 50

export default TabBarBackground
