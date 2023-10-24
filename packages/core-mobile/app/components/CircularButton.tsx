import React, { ReactNode } from 'react'
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import { Opacity10 } from 'resources/Constants'
import AvaText from './AvaText'

type CircularButtonProps = {
  image: ReactNode
  caption: string
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  onPress?: () => void
}

export default function CircularButton({
  image,
  caption,
  disabled,
  style,
  onPress
}: CircularButtonProps) {
  const { theme, isDarkMode } = useApplicationContext()
  return (
    <View style={styles.container}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        android_ripple={{
          color: theme.buttonRipple,
          borderless: true
        }}
        style={[
          styles.circular,
          {
            backgroundColor: isDarkMode
              ? theme.white + Opacity10
              : theme.colorBg1
          },
          style
        ]}>
        {image}
      </Pressable>
      <Space y={8} />
      <AvaText.ButtonSmall textStyle={{ color: theme.colorText1 }}>
        {caption}
      </AvaText.ButtonSmall>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  circular: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    width: 48,
    height: 48,
    borderRadius: 50,
    overflow: 'hidden'
  }
})
