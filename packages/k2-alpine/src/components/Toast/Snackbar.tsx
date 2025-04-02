import React from 'react'
import { TouchableWithoutFeedback, ViewStyle } from 'react-native'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'
import { Text, View } from '../Primitives'
import { useTheme } from '../../hooks'

export const Snackbar = ({
  message,
  testID,
  onPress,
  style
}: {
  message: string
  testID?: string
  onPress?: () => void
  style?: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const backgroundColor = theme.isDark
    ? lightModeColors.$surfacePrimary
    : darkModeColors.$surfacePrimary
  const textColor = theme.isDark
    ? lightModeColors.$textPrimary
    : darkModeColors.$textPrimary

  return (
    <TouchableWithoutFeedback
      style={[
        {
          alignSelf: 'flex-start'
        },
        style
      ]}
      testID={testID}
      onPress={onPress}>
      <View
        sx={{
          backgroundColor,
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 1000
        }}>
        <Text
          variant="subtitle2"
          sx={{
            fontFamily: 'Inter-SemiBold',
            color: textColor
          }}>
          {message}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  )
}
