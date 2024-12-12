import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
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
import { usePinOrBiometryLogin } from 'new/hooks/usePinOrBiometryLogin'
import { useWallet } from 'hooks/useWallet'
import { useFocusEffect, useRouter } from 'expo-router'

const LoginWithPinOrBiometry = (): JSX.Element => {
  const { unlock } = useWallet()
  const router = useRouter()
  const handleLoginSuccess = useCallback(
    (mnemonic: string) => {
      unlock({ mnemonic }).catch(Logger.error)
    },
    [unlock]
  )

  const { theme } = useTheme()
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
  const [isEnteringPin, setIsEnteringPin] = useState(false)

  const pinInputOpacity = useSharedValue(0)
  const pinInputOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: pinInputOpacity.value
    }
  })

  const avatarContainerMarginTop = useSharedValue(40)
  const avatarContainerStyle = useAnimatedStyle(() => {
    return {
      marginTop: avatarContainerMarginTop.value
    }
  })

  const buttonContainerPaddingBottom = useSharedValue(40)
  const buttonContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: buttonContainerPaddingBottom.value
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
    const keyboardHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (pinInputRef.current?.isFocused()) {
        blurPinInput()
      }
    })

    return () => {
      keyboardHideListener.remove()
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      let sub: Subscription
      if (bioType) {
        InteractionManager.runAfterInteractions(() => {
          sub = handlePromptBioLogin()
        })
      } else {
        focusPinInput()
      }

      return () => {
        blurPinInput()
        sub?.unsubscribe()
      }
    }, [bioType, handlePromptBioLogin, focusPinInput])
  )

  useEffect(() => {
    if (mnemonic) {
      handleLoginSuccess(mnemonic)
    }
  }, [mnemonic, handleLoginSuccess])

  useEffect(() => {
    if (isEnteringPin) {
      pinInputOpacity.value = withTiming(1, {
        duration: configuration.animationDuration
      })
      buttonContainerPaddingBottom.value = withTiming(20, {
        duration: configuration.animationDuration
      })
      avatarContainerMarginTop.value = withTiming(10, {
        duration: configuration.animationDuration
      })
    } else {
      pinInputOpacity.value = withTiming(0, {
        duration: configuration.animationDuration
      })
      buttonContainerPaddingBottom.value = withTiming(40, {
        duration: configuration.animationDuration
      })
      avatarContainerMarginTop.value = withTiming(40, {
        duration: configuration.animationDuration
      })
    }
  }, [
    isEnteringPin,
    pinInputOpacity,
    buttonContainerPaddingBottom,
    avatarContainerMarginTop
  ])

  return (
    <SafeAreaView sx={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                <Logos.Core color={theme.colors.$textPrimary} />
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
              <Reanimated.View style={[{ zIndex: -100 }, avatarContainerStyle]}>
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
              <View>
                <Reanimated.View
                  pointerEvents={isEnteringPin ? 'auto' : 'none'}
                  style={[pinInputOpacityStyle]}>
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
                  style={
                    disableKeypad ? { marginTop: 60 } : pinInputOpacityStyle
                  }>
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
  animationDuration: 300
}

export default LoginWithPinOrBiometry
