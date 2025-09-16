import React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useTheme, View } from '@avalabs/k2-alpine'
import { FullWindowOverlay } from 'react-native-screens'
import { PinScreen } from './PinScreen'

export const PinScreenOverlay = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <FullWindowOverlay
      // @ts-ignore: FullWindowOverlayProps is not typed with style, but we can still apply style to Android React Native View component
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: colors.$surfacePrimary
      }}>
      <View
        sx={{
          flex: 1
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
    </FullWindowOverlay>
  )
}
