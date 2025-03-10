import { ActivityIndicator, SxProp, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Platform } from 'react-native'

const SIZE = Platform.OS === 'ios' ? 'small' : 'large'

export const LoadingState = ({ sx }: { sx?: SxProp }): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        ...sx
      }}>
      <ActivityIndicator size={SIZE} color={colors.$textPrimary} />
    </View>
  )
}
