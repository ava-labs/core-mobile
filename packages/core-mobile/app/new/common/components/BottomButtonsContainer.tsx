import React from 'react'
import { SxProp, View } from '@avalabs/k2-alpine'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const BottomButtonsContainer = ({
  sx,
  children
}: {
  sx?: SxProp
  children: React.ReactNode
}): JSX.Element => {
  const { bottom } = useSafeAreaInsets()

  return (
    <View
      sx={{
        padding: 16,
        paddingBottom: bottom + 20,
        gap: 16,
        backgroundColor: '$surfacePrimary',
        ...sx
      }}>
      {children}
    </View>
  )
}
