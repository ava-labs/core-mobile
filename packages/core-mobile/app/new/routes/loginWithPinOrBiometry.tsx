import {
  ANIMATED,
  Avatar,
  Button,
  CircularButton,
  Icons,
  Logos,
  PinInput,
  PinInputActions,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useActiveWalletId } from 'common/hooks/useActiveWallet'
import { usePinOrBiometryLogin } from 'common/hooks/usePinOrBiometryLogin'
import { usePreventScreenRemoval } from 'common/hooks/usePreventScreenRemoval'
import { useFocusEffect, useRouter } from 'expo-router'
import { useWallet } from 'hooks/useWallet'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  InteractionManager,
  Keyboard,
  Platform,
  TouchableWithoutFeedback
} from 'react-native'
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedAvatar } from 'store/settings/avatar'
import BiometricsSDK, { BiometricType } from 'utils/BiometricsSDK'
import Logger from 'utils/Logger'

const LoginWithPinOrBiometry = (): JSX.Element => {
  const walletState = useSelector(selectWalletState)
  usePreventScreenRemoval(walletState === WalletState.INACTIVE)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avatar = useSelector(selectSelectedAvatar)
  const { theme } = useTheme()
  const pinInputRef = useRef<PinInputActions>(null)
  const { unlock } = useWallet()
  const router = useRouter()
  const walletId = useActiveWalletId()

  const isProcessing = useSharedValue(false)
  const [hasNoRecentInput, setHasNoRecentInput] = useState(false)
  const [hasWrongPinEntered, setHasWrongPinEntered] = useState(false)

  const handleWrongPin = (): void => {
    setHasWrongPinEntered(true)
    pinInputRef.current?.fireWrongPinAnimation(() => {
      onEnterPin('')

      focusPinInput()
    })
  }

  const handleStartLoading = useCallback((): void => {
    pinInputRef.current?.startLoadingAnimation()
  }, [])

  const handleStopLoading = (onComplete?: () => void): void => {
    pinInputRef.current?.stopLoadingAnimation(onComplete)
  }

  const handleLoginSuccess = useCallback(() => {
    handleStartLoading()
    pinInputRef.current?.blur()
    isProcessing.value = true

    // JS thread is blocked, so we need to wait for the animation to finish for updating the UI after the keyboard is closed
    setTimeout(async () => {
      try {
        const result = await BiometricsSDK.loadWalletSecret(walletId) //for now we only support one wallet, multiple wallets will be supported in the upcoming PR
        if (!result.success) {
          throw result.error
        }
        try {
          await unlock({ mnemonic: result.value })
        } catch (error) {
          Logger.error('Failed to unlock wallet:', error)
        }
      } catch (error) {
        Logger.error('Failed to load wallet secret:', error)
      }
    }, 0)
  }, [handleStartLoading, isProcessing, unlock, walletId])

  const {
    enteredPin,
    onEnterPin,
    verified,
    verifyBiometric,
    disableKeypad,
    timeRemaining,
    bioType,
    isBiometricAvailable
  } = usePinOrBiometryLogin({
    onWrongPin: handleWrongPin,
    onStartLoading: handleStartLoading,
    onStopLoading: handleStopLoading
  })

  const [isEnteringPin, setIsEnteringPin] = useState(false)

  const forgotPinButtonOpacityStyle = useAnimatedStyle(() => {
    const shouldShowForgotPin =
      disableKeypad === false &&
      isEnteringPin &&
      (hasNoRecentInput || hasWrongPinEntered) &&
      !isProcessing.value

    return {
      marginTop: disableKeypad ? 60 : undefined,
      opacity: withTiming(shouldShowForgotPin ? 1 : 0, { duration: 300 })
    }
  })

  const pinInputOpacity = useSharedValue(0)
  const pinInputOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: isProcessing.value ? 0 : pinInputOpacity.value
    }
  })

  const buttonContainerPaddingBottom = useSharedValue(
    configuration.buttonContainerPaddingBottom.from
  )
  const buttonContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: isProcessing.value ? 0 : 1,
      marginBottom: withTiming(
        buttonContainerPaddingBottom.value,
        ANIMATED.TIMING_CONFIG
      )
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
    // @ts-ignore TODO: make routes typesafe
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
    verifyBiometric().catch(Logger.error)
  }, [verifyBiometric])

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
      InteractionManager.runAfterInteractions(() => {
        if (bioType !== BiometricType.NONE) {
          handlePromptBioLogin()
        } else if (!isBiometricAvailable) {
          focusPinInput()
        }
      })

      return () => {
        blurPinInput()
      }
    }, [bioType, isBiometricAvailable, handlePromptBioLogin, focusPinInput])
  )

  useEffect(() => {
    setTimeout(() => {
      if (!enteredPin && isEnteringPin) {
        setHasNoRecentInput(true)
      }
    }, configuration.noInputTimeout)
  }, [enteredPin, isEnteringPin])

  useEffect(() => {
    if (verified) {
      handleLoginSuccess()
    }
  }, [verified, handleLoginSuccess])

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

  const isProcessingStyle = useAnimatedStyle(() => {
    return {
      opacity: isProcessing.value ? 1 : 0
    }
  })

  const avatarStyle = useAnimatedStyle(() => {
    return {
      opacity: isProcessing.value ? 0 : 1
    }
  })

  return (
    <ScrollScreen
      shouldAvoidKeyboard
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <TouchableWithoutFeedback
        style={{ flex: 1 }}
        onPress={handlePressBackground}>
        <View sx={{ flex: 1, paddingBottom: 16 }}>
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
            <Reanimated.View
              style={[avatarStyle, { zIndex: -100, marginTop: 10 }]}>
              <Avatar
                size="small"
                source={avatar.source}
                backgroundColor={theme.colors.$surfacePrimary}
                isDeveloperMode={isDeveloperMode}
              />
            </Reanimated.View>

            <View>
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
                  isProcessingStyle,
                  {
                    position: 'absolute',
                    top: 15,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 100,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }
                ]}>
                <LoadingState />
              </Reanimated.View>
            </View>
            <Reanimated.View style={[forgotPinButtonOpacityStyle]}>
              <Button size="medium" type="tertiary" onPress={handleForgotPin}>
                Forgot PIN?
              </Button>
            </Reanimated.View>
          </View>

          <Reanimated.View style={buttonContainerStyle}>
            <View
              sx={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 30
              }}>
              {bioType !== BiometricType.NONE && (
                <CircularButton onPress={handlePromptBioLogin}>
                  {bioType === BiometricType.FACE_ID ? (
                    <Icons.Custom.FaceID width={26} height={26} />
                  ) : (
                    <Icons.Custom.TouchID width={26} height={26} />
                  )}
                </CircularButton>
              )}
              {isEnteringPin === false && !disableKeypad && (
                <CircularButton onPress={handleTogglePinInput}>
                  <Icons.Custom.Pin width={26} height={26} />
                </CircularButton>
              )}
            </View>
          </Reanimated.View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollScreen>
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
