import React from 'react'
import { StyleProp, StyleSheet, TextStyle } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import { ReText } from 'react-native-redash'

type Props = {
  text: SharedValue<string>
  style: StyleProp<TextStyle>
  testID?: string
}

export const AnimatedText = ({ text, style, testID }: Props) => {
  return (
    <ReText testID={testID} text={text} style={[styles.container, style]} />
  )
}

const styles = StyleSheet.create({
  container: { padding: 0 } // fix default big padding on Android
})
