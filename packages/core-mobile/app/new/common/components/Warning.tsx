import React from 'react'
import { View, Text, useTheme, Icons, SxProp } from '@avalabs/k2-alpine'

export const Warning = ({
  message,
  sx
}: {
  message: string
  sx?: SxProp
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        ...sx
      }}>
      <Icons.Alert.ErrorOutline color={colors.$textDanger} />
      <View sx={{ flex: 1 }}>
        <Text
          style={{
            color: colors.$textDanger,
            fontFamily: 'Inter-Medium',
            fontSize: 15,
            textAlign: 'left'
          }}>
          {message}
        </Text>
      </View>
    </View>
  )
}
