import React, { useCallback, useState } from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useTheme, View } from '@avalabs/k2-alpine'
import { FullWindowOverlay } from 'react-native-screens'
import { useFocusEffect } from 'expo-router'
import { Keyboard } from 'react-native'
import { useDeleteWallet } from 'common/hooks/useDeleteWallet'
import { ForgotPinComponent } from './ForgotPinComponent'
import { PinScreen } from './PinScreen'

export const PinScreenOverlay = (): JSX.Element => {
  const [showForgotPin, setShowForgotPin] = useState(false)
  const { deleteWallet } = useDeleteWallet()
  const {
    theme: { colors }
  } = useTheme()

  useFocusEffect(
    useCallback(() => {
      Keyboard.dismiss()
    }, [])
  )

  const handleConfirm = useCallback(() => {
    deleteWallet()
  }, [deleteWallet])

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
          flex: 1,
          backgroundColor: colors.$surfacePrimary
        }}>
        <KeyboardAwareScrollView
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flex: 1
          }}>
          {showForgotPin ? (
            <ForgotPinComponent
              onCancel={() => setShowForgotPin(false)}
              onConfirm={handleConfirm}
            />
          ) : (
            <PinScreen onForgotPin={() => setShowForgotPin(true)} />
          )}
        </KeyboardAwareScrollView>
      </View>
    </FullWindowOverlay>
  )
}
