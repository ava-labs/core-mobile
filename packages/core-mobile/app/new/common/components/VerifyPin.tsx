import { PinInput, PinInputActions, Text, View } from '@avalabs/k2-alpine'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useEffect, useRef } from 'react'
import { InteractionManager, Keyboard, Platform } from 'react-native'
import { usePinOrBiometryLogin } from 'common/hooks/usePinOrBiometryLogin'
import { ScrollScreen } from './ScrollScreen'

/**
 * VerifyPin is a component that allows the user to verify their PIN.
 * It can be used to verify the PIN of a currently active wallet.
 * TODO: Separate the biometric verification from VerifyWithPinOrBiometry and use them as separate components.
 * @param onVerified - A function that is called when the user has entered the correct PIN.
 * @returns A component that allows the user to verify their PIN.
 */
export const VerifyPin = ({
  onVerified
}: {
  onVerified: (pin: string) => void
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

  const { enteredPin, onEnterPin, disableKeypad, timeRemaining, verified } =
    usePinOrBiometryLogin({
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

  useEffect(() => {
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
        focusPinInput()
      })

      return () => {
        blurPinInput()
      }
    }, [focusPinInput])
  )

  useEffect(() => {
    if (verified) {
      onVerified(enteredPin)
    }
  }, [enteredPin, onVerified, verified])

  return (
    <ScrollScreen
      title={`Enter your\ncurrent PIN`}
      isModal
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
            <Text variant="heading5">PIN Verification Disabled</Text>
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
