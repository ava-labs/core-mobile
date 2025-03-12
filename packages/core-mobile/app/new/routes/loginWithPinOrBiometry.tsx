import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  InteractionManager,
  Keyboard,
  Platform,
  TouchableWithoutFeedback
} from 'react-native'
import { Subscription } from 'rxjs'
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import Logger from 'utils/Logger'
import {
  CircularButton,
  Icons,
  SafeAreaView,
  Text,
  View,
  Avatar,
  useTheme,
  Logos,
  PinInput,
  Button,
  PinInputActions,
  CIRCULAR_BUTTON_WIDTH
} from '@avalabs/k2-alpine'
import { usePinOrBiometryLogin } from 'common/hooks/usePinOrBiometryLogin'
import { useWallet } from 'hooks/useWallet'
import { useFocusEffect, useRouter } from 'expo-router'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'

const LoginWithPinOrBiometry = (): JSX.Element => {
  const { theme } = useTheme()
  const pinInputRef = useRef<PinInputActions>(null)
  const { unlock } = useWallet()
  const router = useRouter()
  const handleLoginSuccess = useCallback(
    (mnemonic: string) => {
      unlock({ mnemonic }).catch(Logger.error)
    },
    [unlock]
  )
  const [hasNoRecentInput, setHasNoRecentInput] = useState(false)
  const [hasWrongPinEntered, setHasWrongPinEntered] = useState(false)

  const handleWrongPin = (): void => {
    setHasWrongPinEntered(true)
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
  const [isEnteringPin, setIsEnteringPin] = useState(false)
  const shouldShowForgotPin = useMemo(() => {
    return (
      disableKeypad === false &&
      isEnteringPin &&
      (hasNoRecentInput || hasWrongPinEntered)
    )
  }, [disableKeypad, hasNoRecentInput, isEnteringPin, hasWrongPinEntered])

  const forgotPinButtonOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(shouldShowForgotPin ? 1 : 0, { duration: 300 })
    }
  })

  const pinInputOpacity = useSharedValue(0)
  const pinInputOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: pinInputOpacity.get()
    }
  })

  const buttonContainerPaddingBottom = useSharedValue(
    configuration.buttonContainerPaddingBottom.from
  )
  const buttonContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: buttonContainerPaddingBottom.get()
    }
  })

  const focusPinInput = useCallback(() => {
    if (disableKeypad) {
      return
    }

    pinInputRef.current?.focus()
    setIsEnteringPin(true)
  }, [disableKeypad])

  const blurPinInput = (): void => {
    pinInputRef.current?.blur()
    setIsEnteringPin(false)
  }

  const handleForgotPin = (): void => {
    router.navigate('/forgotPin')
  }

  const handleTogglePinInput = (): void => {
    onEnterPin('')
    if (pinInputRef.current?.isFocused()) {
      blurPinInput()
    } else {
      focusPinInput()
    }
  }

  const handlePromptBioLogin = useCallback(() => {
    return promptForWalletLoadingIfExists().subscribe({
      error: err => Logger.error('failed to check biometric', err)
    })
  }, [promptForWalletLoadingIfExists])

  const handlePressBackground = (): void => {
    if (pinInputRef.current?.isFocused()) {
      onEnterPin('')
      blurPinInput()
    }
  }

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
        if (bioType) {
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
    setTimeout(() => {
      if (!enteredPin && isEnteringPin) {
        setHasNoRecentInput(true)
      }
    }, configuration.noInputTimeout)
  }, [enteredPin, isEnteringPin])

  useEffect(() => {
    if (mnemonic) {
      handleLoginSuccess(mnemonic)
    }
  }, [mnemonic, handleLoginSuccess])

  useEffect(() => {
    const pinInputOpacityValue = isEnteringPin ? 1 : 0
    const buttonContainerPaddingBottomValue = isEnteringPin
      ? configuration.buttonContainerPaddingBottom.to
      : configuration.buttonContainerPaddingBottom.from

    pinInputOpacity.value = withTiming(pinInputOpacityValue, {
      duration: configuration.animationDuration
    })
    buttonContainerPaddingBottom.value = withTiming(
      buttonContainerPaddingBottomValue,
      {
        duration: configuration.animationDuration
      }
    )
  }, [isEnteringPin, pinInputOpacity, buttonContainerPaddingBottom])

  return (
    <SafeAreaView sx={{ flex: 1 }}>
      <KeyboardAvoidingView>
        <TouchableWithoutFeedback
          style={{ flex: 1 }}
          onPress={handlePressBackground}>
          <View sx={{ flex: 1 }}>
            <View sx={{ flex: 1, alignItems: 'center' }}>
              <View
                sx={{
                  flex: 1,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                <Logos.AppIcons.Core color={theme.colors.$textPrimary} />
                {disableKeypad && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 24,
                      gap: 8,
                      alignItems: 'center'
                    }}>
                    <Text variant="heading5">Login Disabled</Text>
                    <Text variant="body2">Try again in {timeRemaining}</Text>
                  </View>
                )}
              </View>
              <Reanimated.View style={[{ zIndex: -100, marginTop: 10 }]}>
                <Avatar
                  size="small"
                  // todo: replace with actual avatar
                  source={{
                    uri: 'https://miro.medium.com/v2/resize:fit:1256/format:webp/1*xm2-adeU3YD4MsZikpc5UQ.png'
                  }}
                  hasBlur={!(Platform.OS === 'android' && isEnteringPin)}
                  backgroundColor={theme.colors.$surfacePrimary}
                />
              </Reanimated.View>
              <View
                pointerEvents={
                  isEnteringPin || disableKeypad ? 'auto' : 'none'
                }>
                <Reanimated.View style={[pinInputOpacityStyle]}>
                  {disableKeypad === false && (
                    <PinInput
                      ref={pinInputRef}
                      style={{ paddingTop: 40, paddingBottom: 20 }}
                      length={6}
                      onChangePin={onEnterPin}
                      value={enteredPin}
                    />
                  )}
                </Reanimated.View>
                <Reanimated.View
                  style={[
                    disableKeypad ? { marginTop: 60 } : {},
                    forgotPinButtonOpacityStyle
                  ]}>
                  <Button
                    size="medium"
                    type="tertiary"
                    onPress={handleForgotPin}>
                    Forgot PIN?
                  </Button>
                </Reanimated.View>
              </View>
            </View>
            <Reanimated.View
              style={[
                {
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 30
                },
                buttonContainerStyle
              ]}>
              {bioType && (
                <CircularButton onPress={handlePromptBioLogin}>
                  {bioType === 'Face' ? (
                    <Icons.Custom.FaceID width={26} height={26} />
                  ) : (
                    <Icons.Custom.TouchID width={26} height={26} />
                  )}
                </CircularButton>
              )}
              {isEnteringPin === false && !disableKeypad ? (
                <CircularButton onPress={handleTogglePinInput}>
                  <Icons.Custom.Pin width={26} height={26} />
                </CircularButton>
              ) : (
                <View sx={{ height: CIRCULAR_BUTTON_WIDTH }} />
              )}
            </Reanimated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const configuration = {
  animationDuration: 300,
  buttonContainerPaddingBottom: {
    from: 40,
    to: 20
  },
  noInputTimeout: 3000
}

export default LoginWithPinOrBiometry
