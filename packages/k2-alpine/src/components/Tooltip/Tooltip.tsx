import React from 'react'
import { AlertButton, AlertOptions, Insets } from 'react-native'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { showAlert } from '../Alert/Alert'
import { TouchableOpacity } from '../Primitives'

interface TooltipProps {
  title: string
  description: string
  button?: Omit<AlertButton, 'style'> & { style?: 'default' | 'destructive' }
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
}: TooltipProps): JSX.Element => {
  const { theme } = useTheme()

  const onPress = (): void => {
    showAlert({
      title,
      description,
      buttons: [
        {
          text: 'Got it',
          ...button
        }
      ],
      options: {
        cancelable: true,
        ...options
      }
    })
  }

  return (
    <TouchableOpacity onPress={onPress} hitSlop={hitSlop}>
      <Icons.Alert.AlertCircle
        width={size}
        height={size}
        color={theme.colors.$textPrimary}
      />
    </TouchableOpacity>
  )
}
