import React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

import { FullWindowOverlay } from 'react-native-screens'
import { useTheme, View } from '@avalabs/k2-alpine'
import { PinScreen } from './PinScreen'

export const PinScreenOverlay = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <FullWindowOverlay>
      <View sx={{ flex: 1, backgroundColor: colors.$surfacePrimary }}>
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
