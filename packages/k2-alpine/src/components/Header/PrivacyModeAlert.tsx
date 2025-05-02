import React from 'react'
import { useTheme } from '../../hooks/useTheme'
import { Icons } from '../../theme/tokens/Icons'
import { View, Text } from '../Primitives'

export const PrivacyModeAlert = (): JSX.Element => {
  const { theme } = useTheme()
  const tintColor = theme.colors.$textSecondary

  return (
    <View sx={{ gap: 4, alignItems: 'center', flexDirection: 'row' }}>
      <Icons.Action.VisibilityOff width={16} height={16} color={tintColor} />
      <Text
        variant="buttonMedium"
        sx={{
          color: tintColor,
          fontSize: 14,
          lineHeight: 17
        }}>
        Privacy mode is on
      </Text>
    </View>
  )
}
