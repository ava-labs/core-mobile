import { SxProp, View, useDripsyTheme as useTheme } from 'dripsy'
import React from 'react'

export const Separator = ({ sx }: { sx?: SxProp }): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View sx={{ height: 1, backgroundColor: colors.$borderPrimary, ...sx }} />
  )
}
