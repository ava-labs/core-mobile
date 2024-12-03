import React from 'react'
import { TouchableWithoutFeedback } from 'react-native'
import { useDripsyTheme as useTheme } from 'dripsy'
import { darkModeColors, lightModeColors } from '../../theme/tokens/colors'
import { Text, View } from '../Primitives'

export const Snackbar = ({
  message,
  testID,
  onPress
}: {
  message: string
  testID?: string
  onPress?: () => void
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
      style={{
        alignSelf: 'flex-start'
      }}
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
