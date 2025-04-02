import React, { FC, PropsWithChildren } from 'react'
import {
  PressableStateCallbackType,
  StyleProp,
  StyleSheet,
  ViewStyle
} from 'react-native'
import { Pressable, Text, View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import { TextVariant } from '../../theme/tokens/text'
import { alpha, useTheme } from '../..'

interface BaseButtonProps {
  onPress?: () => void
  disabled?: boolean
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>)
  testID?: string
}

const BaseButton: FC<BaseButtonProps & PropsWithChildren> = ({
  onPress,
  style,
  disabled,
  children,
  testID
}): JSX.Element => {
  return (
    <Pressable
      accessible={false}
      testID={testID}
      style={style}
      onPress={onPress}
      disabled={disabled}>
      {children}
    </Pressable>
  )
}

export type ButtonType =
  | 'primary'
  | 'primaryDanger'
  | 'secondary'
  | 'tertiary'
  | 'tertiaryDanger'
export type ButtonSize = 'small' | 'medium' | 'large' | 'xlarge'

type ButtonIconType =
  | 'check'
  | 'expandMore'
  | 'copy'
  | 'add'
  | 'google'
  | 'apple'

interface ButtonProps extends BaseButtonProps {
  type: ButtonType
  size: ButtonSize
  leftIcon?: ButtonIconType
  rightIcon?: ButtonIconType
  style?: ViewStyle
  testID?: string
}

export const Button: FC<ButtonProps & PropsWithChildren> = ({
  type,
  size,
  leftIcon,
  rightIcon,
  disabled,
  style,
  children,
  testID,
  ...rest
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const tintColor = (pressed: boolean): string => {
    if (disabled) {
      switch (type) {
        case 'primary':
        case 'primaryDanger':
        case 'secondary':
          return colors.$neutral500
        case 'tertiary':
        case 'tertiaryDanger':
          return colors.$neutral700
      }
    }

    switch (type) {
      case 'primary':
        return colors.$neutral900
      case 'primaryDanger':
        return colors.$dangerMain
      case 'secondary':
        return colors.$neutral50
      case 'tertiary':
        return pressed ? colors.$blueLight : colors.$blueDark
      case 'tertiaryDanger':
        return pressed ? colors.$dangerLight : colors.$dangerMain
    }
  }

  const backgroundColor = (pressed: boolean): string => {
    switch (type) {
      case 'primary':
      case 'primaryDanger':
        return pressed
          ? colors.$neutral400
          : disabled
          ? alpha(colors.$neutral700, 0.5)
          : colors.$neutral50
      case 'secondary':
        return pressed
          ? alpha(colors.$neutral700, 0.8)
          : alpha(colors.$neutral700, 0.5)
      case 'tertiary':
      case 'tertiaryDanger':
        return 'transparent'
    }
  }

  const iconWidth = { xlarge: 24, large: 20, medium: 16, small: 16 }[size]
  const textVariant = {
    xlarge: 'buttonLarge',
    large: 'buttonMedium',
    medium: 'buttonMedium',
    small: 'buttonSmall'
  }[size] as TextVariant

  return (
    <BaseButton
      testID={testID}
      style={({ pressed }) => {
        return {
          borderRadius: 1000,
          alignItems: 'center',
          backgroundColor: backgroundColor(pressed),
          ...sizeStyles[size],
          ...style
        }
      }}
      disabled={disabled}
      {...rest}>
      {/* @ts-ignore */}
      {({ pressed }: { pressed: boolean }) => {
        const color = tintColor(pressed)
        return (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 8,
              minHeight: iconWidth
            }}>
            {leftIcon ? (
              getIcon(leftIcon, {
                width: iconWidth,
                height: iconWidth,
                color,
                style: { marginRight: 8 }
              })
            ) : rightIcon ? (
              <View style={{ width: iconWidth, marginRight: 8 }} />
            ) : null}
            <Text
              numberOfLines={1}
              variant={textVariant}
              style={{
                color: color,
                flexShrink: 1
              }}>
              {children}
            </Text>
            {rightIcon ? (
              getIcon(rightIcon, {
                width: iconWidth,
                height: iconWidth,
                color,
                style: { marginLeft: 8 }
              })
            ) : leftIcon ? (
              <View style={{ width: iconWidth, marginLeft: 8 }} />
            ) : null}
          </View>
        )
      }}
    </BaseButton>
  )
}

const sizeStyles = StyleSheet.create({
  xlarge: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  medium: {
    padding: 8
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 4
  }
})

const iconComponents = {
  check: Icons.Navigation.Check,
  expandMore: Icons.Navigation.ExpandMore,
  copy: Icons.Content.ContentCopy,
  add: Icons.Content.Add,
  google: Icons.Logos.Google,
  apple: Icons.Logos.Apple
}

const getIcon = (
  type: ButtonIconType,
  iconProps: {
    width: number
    height: number
    color: string
    style?: ViewStyle
  }
): JSX.Element => {
  const IconComponent = iconComponents[type]
  return <IconComponent {...iconProps} />
}
