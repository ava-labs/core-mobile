import React from 'react'
import { TouchableWithoutFeedback, ViewStyle } from 'react-native'
import { Text, View } from '../Primitives'
import { useTheme } from '../../hooks'
import { SCREEN_WIDTH } from '../../const'

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
  const backgroundColor = theme.colors.$inverseSurface
  const textColor = theme.colors.$inverseOnSurface

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
        style={{
          width: SCREEN_WIDTH,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <View
          style={{
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
      </View>
    </TouchableWithoutFeedback>
  )
}
