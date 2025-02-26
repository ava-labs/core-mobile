import { SxProp, View } from 'dripsy'
import React from 'react'
import { useTheme } from '../../hooks'

export const Separator = ({ sx }: { sx?: SxProp }): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View
      sx={{
        height: 1,
        backgroundColor: colors.$borderPrimary,
        ...sx
      }}
    />
  )
}
