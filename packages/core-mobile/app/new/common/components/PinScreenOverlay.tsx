import React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useTheme, View } from '@avalabs/k2-alpine'
import { PinScreen } from './PinScreen'

export const PinScreenOverlay = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: colors.$surfacePrimary
      }}>
      <KeyboardAwareScrollView
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flex: 1
        }}>
        <PinScreen />
      </KeyboardAwareScrollView>
    </View>
  )
}
