import React from 'react'
import { TouchableWithoutFeedback } from 'react-native'
import { useDripsyTheme as useTheme } from 'dripsy'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'
import { Text, View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'

export const NotificationAlert = ({
  type,
  title,
  message,
  testID,
  onPress
}: {
  type: NotificationAlertType
  title: string
  message?: string
  testID?: string
  onPress?: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const backgroundColor = theme.isDark
    ? lightModeColors.$surfacePrimary
    : darkModeColors.$surfacePrimary
  const titleColor = theme.isDark
    ? lightModeColors.$textPrimary
    : darkModeColors.$textPrimary
  const messageColor = theme.isDark
    ? lightModeColors.$textSecondary
    : darkModeColors.$textSecondary
  const successColor = theme.isDark
    ? lightModeColors.$textSuccess
    : darkModeColors.$textSuccess
  const errorColor = theme.isDark
    ? lightModeColors.$textDanger
    : darkModeColors.$textDanger

  const renderIcon = (): JSX.Element | undefined => {
    switch (type) {
      case NotificationAlertType.Info:
        return <Icons.Action.Info color={titleColor} />
      case NotificationAlertType.Success:
        return <Icons.Action.CheckCircleOutline color={successColor} />
      case NotificationAlertType.CriticalError:
        return <Icons.Alert.IconErrorOutline color={errorColor} />
      case NotificationAlertType.Error:
        return <Icons.Custom.Error color={titleColor} />
      case NotificationAlertType.Suspicious:
        return <Icons.Device.IconGPPMaybe color={errorColor} />
      case NotificationAlertType.Scam:
        return <Icons.Social.RemoveModerator color={errorColor} />
    }
  }

  const hasMessage = !!message

  return (
    <TouchableWithoutFeedback testID={testID} onPress={onPress}>
      <View
        sx={{
          backgroundColor,
          paddingVertical: hasMessage ? 16 : 8,
          paddingHorizontal: 16,
          borderRadius: 18,
          flexDirection: 'row',
          gap: 16,
          width: '100%',
          alignItems: 'center'
        }}>
        <View>{renderIcon()}</View>
        <View sx={{ flexShrink: 1 }}>
          <Text
            variant={hasMessage ? 'subtitle2' : 'buttonMedium'}
            sx={{
              fontFamily: 'Inter-SemiBold',
              color: titleColor
            }}>
            {title}
          </Text>
          {hasMessage && (
            <Text
              variant="subtitle2"
              sx={{
                color: messageColor
              }}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}

export enum NotificationAlertType {
  Info = 'info',
  Success = 'success',
  CriticalError = 'criticalError',
  Error = 'error',
  Suspicious = 'suspicious',
  Scam = 'scam'
}
