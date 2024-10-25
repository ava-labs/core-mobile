import React from 'react'
import { Linking, StyleProp, TextStyle } from 'react-native'
import { Text } from '../components/Primitives'
import { useTheme } from '..'

type Props = {
  title: string
  url: string
  style?: StyleProp<TextStyle>
  color?: string
}

const Link = ({ title, url, style, color }: Props): JSX.Element => {
  const { theme } = useTheme()

  return (
    <Text
      variant="heading5"
      onPress={() => {
        Linking.openURL(url)
      }}
      style={[
        style,
        {
          color: color ?? theme.colors.$textPrimary,
          textDecorationLine: 'underline'
        }
      ]}>
      {title}
    </Text>
  )
}

export default Link
