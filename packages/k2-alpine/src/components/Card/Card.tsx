import React, { PropsWithChildren } from 'react'
import { SxProp } from 'dripsy'
import { View } from '../Primitives'
import { useTheme } from '../../hooks'

export const Card = ({
  sx,
  children
}: {
  sx?: SxProp
} & PropsWithChildren): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        borderRadius: 18,
        padding: 17,
        backgroundColor: colors.$surfaceSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        ...sx
      }}>
      {children}
    </View>
  )
}
