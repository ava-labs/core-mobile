import React from 'react'
import { Dimensions, Pressable, ViewStyle } from 'react-native'
import { alpha } from '../../utils'
import { Text, View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import { useTheme } from '../../hooks'

export const NotificationAlert = ({
  type,
  title,
  message,
  testID,
  onPress,
  style
}: {
  type: NotificationAlertType
  title: string
  message?: string
  testID?: string
  onPress?: () => void
  style?: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const backgroundColor = theme.colors.$inverseSurface
  const titleColor = theme.colors.$inverseOnSurface
  const messageColor = alpha(theme.colors.$inverseOnSurface, 0.6)
  // Success / danger keep their semantic hue regardless of surface — readable
  // against both dark and light inverse fills.
  const successColor = theme.colors.$textSuccess
  const errorColor = theme.colors.$textDanger

  const renderIcon = (): JSX.Element | undefined => {
    switch (type) {
      case 'info':
        return <Icons.Action.Info color={titleColor} />
      case 'success':
        return <Icons.Action.CheckCircleOutline color={successColor} />
      case 'criticalError':
        return <Icons.Alert.ErrorOutline color={errorColor} />
      case 'error':
        return <Icons.Custom.Error color={titleColor} />
      case 'suspicious':
        return <Icons.Device.GPPMaybe color={errorColor} />
      case 'scam':
        return <Icons.Social.RemoveModerator color={errorColor} />
    }
  }

  const hasMessage = !!message

  return (
    <Pressable style={style} testID={testID} onPress={onPress}>
      <View
        sx={{
          backgroundColor,
          paddingVertical: hasMessage ? 16 : 8,
          paddingHorizontal: 16,
          borderRadius: 18,
          flexDirection: 'row',
          gap: 16,
          alignItems: 'center',
          width: windowWidth - 24
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
    </Pressable>
  )
}

export type NotificationAlertType =
  | 'info'
  | 'success'
  | 'criticalError'
  | 'error'
  | 'suspicious'
  | 'scam'

const windowWidth = Dimensions.get('window').width
