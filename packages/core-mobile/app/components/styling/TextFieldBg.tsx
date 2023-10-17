import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

const TextFieldBg = ({
  style,
  children
}: {
  style?: StyleProp<ViewStyle>
  children: any
}) => {
  const { theme } = useApplicationContext()
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colorBg2 }, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8
  }
})

export default TextFieldBg
