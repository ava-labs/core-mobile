import React from 'react'
import { Linking, StyleProp, TextStyle } from 'react-native'
import { Text } from '../components/Primitives'

type Props = {
  title: string
  url: string
  style?: StyleProp<TextStyle>
  color?: string
}

const Link = ({ title, url, style }: Props): JSX.Element => {
  return (
    <Text
      variant="heading5"
      onPress={() => {
        Linking.openURL(url)
      }}
      style={[
        style,
        {
          textDecorationLine: 'underline'
        }
      ]}>
      {title}
    </Text>
  )
}

export default Link
