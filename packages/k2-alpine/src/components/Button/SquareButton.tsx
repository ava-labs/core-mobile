import React from 'react'
import { ViewStyle } from 'react-native'
import { Icons } from '../../theme/tokens/Icons'
import { Text, TouchableOpacity, View } from '../Primitives'
import { useTheme } from '../../hooks'

export const SquareButton = ({
  title,
  icon,
  onPress,
  style
}: {
  title: string
  icon: SquareButtonIconType
  onPress?: () => void
  style?: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <TouchableOpacity style={style} onPress={onPress}>
      <View
        sx={{
          borderRadius: 12,
          width: 75,
          height: 75,
          backgroundColor: '$surfaceSecondary'
        }}>
        <View sx={{ position: 'absolute', top: 11, left: 11 }}>
          {getIcon(icon, {
            width: 24,
            height: 24,
            color: theme.colors.$textPrimary
          })}
        </View>
        <Text
          sx={{
            position: 'absolute',
            bottom: 7,
            left: 13,
            fontSize: 11,
            lineHeight: 21,
            fontFamily: 'Inter-SemiBold'
          }}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export type SquareButtonIconType =
  | 'bridge'
  | 'swap'
  | 'send'
  | 'stake'
  | 'buy'
  | 'connect'

const iconComponents = {
  bridge: Icons.Custom.SwitchRight,
  swap: Icons.Custom.Compare,
  send: Icons.Custom.Send,
  stake: Icons.Custom.Psychiatry,
  buy: Icons.Content.Add,
  connect: Icons.Custom.Connect
}

const getIcon = (
  type: SquareButtonIconType,
  iconProps: {
    width: number
    height: number
    color: string
    style?: ViewStyle
  }
): JSX.Element | undefined => {
  const IconComponent = iconComponents[type]
  return <IconComponent {...iconProps} />
}
