import React from 'react'
import { Alert, AlertButton, AlertOptions, Insets } from 'react-native'
import { Icons } from '../../theme/tokens/Icons'
import { TouchableOpacity } from '../Primitives'

interface TooltipProps {
  title: string
  description: string
  buttons?: AlertButton[]
  options?: AlertOptions
  size?: number
  hitSlop?: Insets
}

export const Tooltip = ({
  title,
  description,
  buttons,
  options,
  size = 18,
  hitSlop = {
    top: 13,
    right: 13,
    bottom: 13,
    left: 13
  }
}: TooltipProps) => {
  const onPress = () => {
    Alert.alert(
      title,
      description,
      buttons?.length
        ? buttons
        : [
            {
              text: 'Got it',
              isPreferred: true,
              onPress: () => console.log('OK Pressed')
            }
          ],
      options
    )
  }

  return (
    <TouchableOpacity onPress={onPress} hitSlop={hitSlop}>
      <Icons.Alert.AlertCircleLight width={size} height={size} />
    </TouchableOpacity>
  )
}
