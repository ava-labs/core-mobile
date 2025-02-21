import React from 'react'
import {
  Alert,
  AlertButton,
  AlertOptions,
  Insets,
  useColorScheme
} from 'react-native'
import { Icons } from '../../theme/tokens/Icons'
import { TouchableOpacity } from '../Primitives'
import { useTheme } from '../../hooks'

interface TooltipProps {
  title: string
  description: string
  button?: AlertButton
  options?: AlertOptions
  size?: number
  hitSlop?: Insets
}

export const Tooltip = ({
  title,
  description,
  button,
  options,
  size = 18,
  hitSlop = {
    top: 13,
    right: 13,
    bottom: 13,
    left: 13
  }
}: TooltipProps) => {
  const { theme } = useTheme()

  const onIconPress = () => {
    Alert.alert(
      title,
      description,
      [
        {
          text: 'Got it',
          isPreferred: true,
          ...button
        }
      ],
      { ...options, cancelable: true }
    )
  }

  return (
    <TouchableOpacity onPress={onIconPress} hitSlop={hitSlop}>
      {theme.isDark ? (
        <Icons.Alert.AlertCircleDark width={size} height={size} />
      ) : (
        <Icons.Alert.AlertCircleLight width={size} height={size} />
      )}
    </TouchableOpacity>
  )
}
