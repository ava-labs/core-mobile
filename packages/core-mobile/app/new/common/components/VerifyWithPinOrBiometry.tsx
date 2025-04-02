import React, { useCallback, useEffect, useRef } from 'react'
import { InteractionManager, Keyboard, Platform } from 'react-native'
import { Subscription } from 'rxjs'
import Logger from 'utils/Logger'
import { Text, View, PinInput, PinInputActions } from '@avalabs/k2-alpine'
import { usePinOrBiometryLogin } from 'common/hooks/usePinOrBiometryLogin'
import { useFocusEffect } from 'expo-router'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import { BiometricType } from 'services/deviceInfo/DeviceInfoService'

export const VerifyWithPinOrBiometry = ({
  onLoginSuccess
}: {
  onLoginSuccess: (mnemonic: string) => void
}): JSX.Element => {
  const pinInputRef = useRef<PinInputActions>(null)

  const handleWrongPin = (): void => {
    pinInputRef.current?.fireWrongPinAnimation(() => {
      onEnterPin('')
      focusPinInput()
    })
  }
  const handleStartLoading = (): void => {
    pinInputRef.current?.startLoadingAnimation()
  }
  const handleStopLoading = (onComplete?: () => void): void => {
    pinInputRef.current?.stopLoadingAnimation(onComplete)
  }

  const {
    enteredPin,
    onEnterPin,
    mnemonic,
    promptForWalletLoadingIfExists,
    disableKeypad,
    timeRemaining,
    bioType
  } = usePinOrBiometryLogin({
    onWrongPin: handleWrongPin,
    onStartLoading: handleStartLoading,
    onStopLoading: handleStopLoading
  })

  const focusPinInput = useCallback(() => {
    if (disableKeypad) {
      return
    }

    pinInputRef.current?.focus()
  }, [disableKeypad])

  const blurPinInput = (): void => {
    pinInputRef.current?.blur()
  }

  const handlePromptBioLogin = useCallback(() => {
    return promptForWalletLoadingIfExists().subscribe({
      error: err => Logger.error('failed to check biometric', err)
    })
  }, [promptForWalletLoadingIfExists])

  useEffect(() => {
    // When the hide keyboard button is pressed on Android, it doesn’t update the isEnteringPin state,
    // causing the keyboard to close and leading to UI bugs.
    // That’s why we only add the event listener for Android.
    const keyboardHideListener =
      Platform.OS === 'android'
        ? Keyboard.addListener('keyboardDidHide', () => {
            if (pinInputRef.current?.isFocused()) {
              blurPinInput()
            }
          })
        : undefined

    return () => {
      keyboardHideListener?.remove()
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      let sub: Subscription
      InteractionManager.runAfterInteractions(() => {
        if (bioType !== BiometricType.NONE) {
          sub = handlePromptBioLogin()
        } else {
          focusPinInput()
        }
      })

      return () => {
        blurPinInput()
        sub?.unsubscribe()
      }
    }, [bioType, handlePromptBioLogin, focusPinInput])
  )

  useEffect(() => {
    if (mnemonic) {
      onLoginSuccess(mnemonic)
    }
  }, [mnemonic, onLoginSuccess])

  return (
    <KeyboardAvoidingView>
      <Text variant="heading2" sx={{ marginLeft: 16, marginRight: 100 }}>
        Enter your current PIN
      </Text>
      <View
        sx={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        {disableKeypad && (
          <View
            style={{
              gap: 8,
              paddingBottom: 20,
              alignItems: 'center'
            }}>
            <Text variant="heading5">Login Disabled</Text>
            <Text variant="body2">Try again in {timeRemaining}</Text>
          </View>
        )}
        <PinInput
          disabled={disableKeypad}
          ref={pinInputRef}
          length={6}
          onChangePin={onEnterPin}
          value={enteredPin}
        />
      </View>
    </KeyboardAvoidingView>
  )
}
