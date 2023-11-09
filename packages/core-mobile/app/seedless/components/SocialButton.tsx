import { Pressable, View, useTheme } from '@avalabs/k2-mobile'
import React, { FC, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { alpha } from '@avalabs/k2-mobile/src/theme/tokens/colors'
import GoogleLogo from '../assets/google.svg'
import AppleLogo from '../assets/apple.svg'

type Props = {
  type: 'google' | 'apple'
  onPress: () => void
}

const SocialButton: FC<Props> = ({ type, onPress }) => {
  const {
    theme: { colors }
  } = useTheme()
  const logo = useMemo(() => {
    switch (type) {
      case 'google':
        return <GoogleLogo />
      case 'apple':
        return <AppleLogo />
    }
  }, [type])

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.container,
            { backgroundColor: alpha(colors.$neutral700, pressed ? 0.8 : 0.5) }
          ]}>
          {logo}
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 100
  }
})

export default SocialButton
