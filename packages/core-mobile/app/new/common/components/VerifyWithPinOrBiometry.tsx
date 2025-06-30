import { PinInput, PinInputActions, Text, View } from '@avalabs/k2-alpine'
import { usePinOrBiometryLogin } from 'common/hooks/usePinOrBiometryLogin'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useEffect, useRef } from 'react'
import { InteractionManager, Keyboard, Platform } from 'react-native'
import Logger from 'utils/Logger'
import BiometricsSDK from 'utils/BiometricsSDK'
import { ScrollScreen } from './ScrollScreen'

export const VerifyWithPinOrBiometry = ({
  onVerifySuccess
}: {
  onVerifySuccess: () => void
}): JSX.Element => {
  const pinInputRef = useRef<PinInputActions>(null)
  const [isHandledBioPrompt, setIsHandledBioPrompt] = React.useState(false)

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
    verified,
    verifyBiometric,
    disableKeypad,
    timeRemaining
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

  const handlePromptBioLogin = useCallback(async () => {
    try {
      return await verifyBiometric()
    } catch (err) {
      Logger.error('failed to check biometric', err)
    }
  }, [verifyBiometric])

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
      InteractionManager.runAfterInteractions(() => {
        const accessType = BiometricsSDK.getAccessType()
        if (accessType === 'BIO' && !isHandledBioPrompt) {
          setIsHandledBioPrompt(true)
          handlePromptBioLogin().catch(Logger.error)
        } else {
          focusPinInput()
        }
      })

      return () => {
        blurPinInput()
      }
    }, [isHandledBioPrompt, handlePromptBioLogin, focusPinInput])
  )

  useEffect(() => {
    if (verified) {
      onVerifySuccess()
    }
  }, [verified, onVerifySuccess])

  return (
    <ScrollScreen
      title={`Enter your\ncurrent PIN`}
      navigationTitle="Enter your current PIN"
      isModal
      shouldAvoidKeyboard
      contentContainerStyle={{
        padding: 16,
        flex: 1
      }}>
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
    </ScrollScreen>
  )
}
