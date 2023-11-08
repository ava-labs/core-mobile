import React from 'react'
import { Linking, StyleProp, ViewStyle } from 'react-native'
import { Text } from '../components/Primitives'

type Props = {
  title: string
  url: string
  style?: StyleProp<ViewStyle>
}

const Link = ({ title, url, style }: Props): JSX.Element => {
  return (
    <Text
      variant="heading5"
      onPress={() => {
        Linking.openURL(url)
      }}
      sx={{
        color: '$blueMain',
        textDecorationLine: 'underline'
      }}
      style={style}>
      {title}
    </Text>
  )
}

export default Link
