import React, { type FC, type PropsWithChildren } from 'react'
import { type K2AlpineTheme } from '../../theme/theme'
import { Pressable, Text } from '../Primitives'
import { useTheme } from '../..'

export type Props = {
  onPress: () => void
  type?: 'primary' | 'secondary' | 'tertiary'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

const getTypeColors = (
  type: Props['type'],
  theme: K2AlpineTheme
): { background: string; text: string } => {
  switch (type) {
    case 'secondary':
      return {
        background: theme.colors.$secondaryBackground,
        text: theme.colors.$secondaryText
      }
    case 'tertiary':
      return {
        background: theme.colors.$tertiaryBackground,
        text: theme.colors.$tertiaryText
      }
    case 'primary':
    default:
      return {
        background: theme.colors.$primaryBackground,
        text: theme.colors.$primaryText
      }
  }
}

export const Button: FC<PropsWithChildren<Props>> = ({
  onPress,
  type = 'primary',
  size = 'large',
  disabled,
  children
}) => {
  const { theme } = useTheme()
  const colors = getTypeColors(type, theme)

  return (
    <Pressable
      sx={{
        backgroundColor: colors.background,
        opacity: disabled ? theme.styles.disabledOpacity : 1,
        borderRadius: theme.styles.borderRadius,
        width: size === 'large' ? '100%' : '50%'
      }}
      onPress={onPress}>
      <Text sx={{ color: colors.text }}>{children}</Text>
    </Pressable>
  )
}
