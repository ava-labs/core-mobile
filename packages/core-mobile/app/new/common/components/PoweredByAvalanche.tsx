import { Icons, Text, View, useTheme } from '@avalabs/k2-alpine'
import React from 'react'

export const PoweredByAvalanche = (): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
      }}>
      <Text
        variant="caption"
        sx={{ color: theme.colors.$textSecondary, lineHeight: 16 }}>
        Powered by
      </Text>
      <Icons.Custom.Avalanche color={theme.colors.$textSecondary} />
      <Text
        variant="caption"
        sx={{ color: theme.colors.$textSecondary, lineHeight: 16 }}>
        Avalanche
      </Text>
    </View>
  )
}
