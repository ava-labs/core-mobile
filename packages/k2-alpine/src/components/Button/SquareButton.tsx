import React from 'react'
import { ViewStyle } from 'react-native'
import { Icons } from '../../theme/tokens/Icons'
import { Text, View } from '../Primitives'
import { useTheme } from '../../hooks'
import { AnimatedPressable } from '../Animated/AnimatedPressable'

export const SquareButton = ({
  title,
  icon,
  onPress,
  style,
  disabled,
  testID
}: {
  title: string
  icon: SquareButtonIconType
  onPress?: () => void
  style?: ViewStyle
  disabled?: boolean
  testID?: string
}): JSX.Element => {
  const { theme } = useTheme()
  const tintColor = disabled
    ? theme.colors.$textSecondary
    : theme.colors.$textPrimary

  return (
    <AnimatedPressable style={style} onPress={onPress} disabled={disabled}>
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
            color: tintColor
          })}
        </View>
        <Text
          testID={testID}
          sx={{
            position: 'absolute',
            bottom: 7,
            left: 13,
            fontSize: 11,
            lineHeight: 21,
            fontFamily: 'Inter-SemiBold',
            color: tintColor
          }}>
          {title}
        </Text>
      </View>
    </AnimatedPressable>
  )
}

export type SquareButtonIconType =
  | 'bridge'
  | 'swap'
  | 'send'
  | 'stake'
  | 'buy'
  | 'hide'
  | 'show'
  | 'receive'
  | 'withdraw'

const iconComponents = {
  bridge: Icons.Custom.SwitchRight,
  swap: Icons.Custom.Compare,
  send: Icons.Custom.Send,
  stake: Icons.Custom.Psychiatry,
  buy: Icons.Content.Add,
  hide: Icons.Action.VisibilityOff,
  show: Icons.Action.VisibilityOn,
  receive: Icons.Communication.QRCode2,
  withdraw: Icons.Custom.Cash
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
