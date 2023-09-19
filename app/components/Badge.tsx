import { AppTheme, useApplicationContext } from 'contexts/ApplicationContext'
import React from 'react'
import {
  LayoutRectangle,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native'
import AvaText from './AvaText'

interface BadgeProps {
  text: string
  style?: StyleProp<ViewStyle>
  onLayout?: (layout: LayoutRectangle) => void
}

const Badge = ({ text, style, onLayout }: BadgeProps) => {
  const { theme } = useApplicationContext()

  const styles = getStyles(theme)

  return (
    <View
      style={[styles.container, style]}
      onLayout={({ nativeEvent }) => {
        onLayout?.(nativeEvent.layout)
      }}>
      <AvaText.Body3 color={theme.neutral50}>{text}</AvaText.Body3>
    </View>
  )
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      borderRadius: 2000,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colorPrimary1,
      paddingHorizontal: 5,
      paddingVertical: 1
    }
  })

export default Badge
