import { Pressable, View, useTheme } from '@avalabs/k2-mobile'
import React, { FC, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { alpha } from '@avalabs/k2-mobile/src/theme/tokens/colors'
import GoogleLogo from 'assets/icons/google.svg'
import AppleLogo from 'assets/icons/apple.svg'

type Props = {
  type: 'google' | 'apple'
  disabled?: boolean
  onPress: () => void
}

const LOGO_SIZE = 32

const SocialButton: FC<Props> = ({ type, disabled, onPress }) => {
  const {
    theme: { colors }
  } = useTheme()
  const logo = useMemo(() => {
    switch (type) {
      case 'google':
        return <GoogleLogo width={LOGO_SIZE} height={LOGO_SIZE} />
      case 'apple':
        return <AppleLogo width={LOGO_SIZE} height={LOGO_SIZE} />
    }
  }, [type])

  return (
    <Pressable disabled={disabled} onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.container,
            { backgroundColor: alpha(colors.$neutral700, pressed ? 0.8 : 0.5) }
          ]}>
          <View style={{ opacity: disabled ? 0.5 : 1 }}>{logo}</View>
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
