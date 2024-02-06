import React, { useEffect } from 'react'
import {
  Animated,
  Dimensions,
  InteractionManager,
  Keyboard,
  StyleSheet
} from 'react-native'
import PinKey, { PinKeys } from 'screens/onboarding/PinKey'
import { Space } from 'components/Space'
import DotSVG from 'components/svg/DotSVG'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import { Subscription } from 'rxjs'
import ReAnimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import Logger from 'utils/Logger'
import { Text, useTheme, View } from '@avalabs/k2-mobile'
import { selectWalletType } from 'store/app'
import { useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { noop } from '@avalabs/utils-sdk'
import { isIphoneSE } from 'utils/device/isIphoneSE'
import { usePinOrBiometryLogin } from './PinOrBiometryLoginViewModel'

const WINDOW_HEIGHT = Dimensions.get('window').height

const keymap: Map<string, PinKeys> = new Map([
  ['1', PinKeys.Key1],
  ['2', PinKeys.Key2],
  ['3', PinKeys.Key3],
  ['4', PinKeys.Key4],
  ['5', PinKeys.Key5],
  ['6', PinKeys.Key6],
  ['7', PinKeys.Key7],
  ['8', PinKeys.Key8],
  ['9', PinKeys.Key9],
  ['0', PinKeys.Key0],
  ['<', PinKeys.Backspace]
])
const LOGO_HEIGHT = 100

// on iphone SE, we need to reduce the top spacing
// or else the forgot pin button will be hidden due to the small screen size
const TOP_SPACE = isIphoneSE() ? 24 : 64

type Props = {
  onSignInWithRecoveryPhrase?: () => void
  onSignOut?: () => void
  onLoginSuccess: (mnemonic: string) => void
  isResettingPin?: boolean
  hideLoginWithMnemonic?: boolean
  testID?: string
}

/**
 * This screen will select appropriate login method (pin or biometry) and call onLoginSuccess upon successful login.
 */
export default function PinOrBiometryLogin({
  onSignInWithRecoveryPhrase,
  onSignOut,
  onLoginSuccess,
  isResettingPin,
  hideLoginWithMnemonic = false
}: Props | Readonly<Props>): JSX.Element {
  const { theme } = useTheme()
  const {
    pinDots,
    onEnterPin,
    mnemonic,
    promptForWalletLoadingIfExists,
    jiggleAnim,
    disableKeypad,
    timeRemaining
  } = usePinOrBiometryLogin()
  const walletType = useSelector(selectWalletType)
  const navigation = useNavigation()

  const logoTranslateY = useSharedValue(0)
  const opacity = useSharedValue(1)

  const logoTranslateYStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(logoTranslateY.value, {
            duration: 500,
            easing: Easing.inOut(Easing.ease)
          })
        }
      ]
    }
  })

  const fadeOutStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value)
    }
  })

  useEffect(() => {
    Keyboard.dismiss()
  }, [])

  useEffect(() => {
    let sub: Subscription

    // check if if the login is biometric
    InteractionManager.runAfterInteractions(() => {
      sub = promptForWalletLoadingIfExists().subscribe({
        error: err => Logger.error('failed to check biometric', err)
      })
    })

    return () => sub?.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mnemonic) {
      logoTranslateY.value = (WINDOW_HEIGHT - LOGO_HEIGHT) / 2 - TOP_SPACE * 3
      opacity.value = 0
      setTimeout(() => {
        onLoginSuccess(mnemonic)
      }, 500)
    }
  }, [logoTranslateY, mnemonic, onLoginSuccess, opacity])

  const generatePinDots = (): Element[] => {
    const dots: Element[] = []

    pinDots.forEach((value, key) => {
      dots.push(
        <DotSVG
          fillColor={value.filled ? theme.colors.$blueMain : undefined}
          borderColor={theme.colors.$neutral400}
          key={key}
        />
      )
    })
    return dots
  }

  const keyboard = (): Element[] => {
    const keys: Element[] = []
    '123456789 0<'.split('').forEach((value, key) => {
      keys.push(
        <View key={key} style={styles.pinKey}>
          <PinKey
            keyboardKey={keymap.get(value)}
            onPress={onEnterPin}
            disabled={disableKeypad}
          />
        </View>
      )
    })
    return keys
  }

  const handleForgotPin = (): void => {
    if (walletType === WalletType.MNEMONIC) {
      navigation.navigate(AppNavigation.Root.ForgotPin, {
        title: 'Have you written down your recovery phrase?',
        message:
          'This will terminate this session, without your phrase you will not be able to access the current wallet.',
        onConfirm: onSignInWithRecoveryPhrase || noop
      })
    } else if (walletType === WalletType.SEEDLESS) {
      navigation.navigate(AppNavigation.Root.ForgotPin, {
        title: 'Reset PIN?',
        message:
          'By clicking Continue, you will need to reset your PIN and recover your wallet.',
        onConfirm: onSignOut || noop
      })
    }
  }

  return (
    <View sx={{ height: '100%', backgroundColor: theme.colors.$black }}>
      <Space y={TOP_SPACE} />
      {!isResettingPin && (
        <ReAnimated.View
          style={[
            {
              justifyContent: 'center',
              alignItems: 'center'
            },
            logoTranslateYStyle
          ]}>
          <CoreXLogoAnimated size={LOGO_HEIGHT} />
          {mnemonic && <Text variant="subtitle1">Unlocking wallet...</Text>}
        </ReAnimated.View>
      )}
      {
        <ReAnimated.View style={fadeOutStyle}>
          <View style={styles.growContainer}>
            <Animated.View
              style={[
                { padding: 60 },
                {
                  transform: [
                    {
                      translateX: jiggleAnim
                    }
                  ]
                }
              ]}>
              <View style={styles.dots}>{generatePinDots()}</View>
            </Animated.View>
            {disableKeypad && (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text variant="heading5">Login Disabled</Text>
                <Space y={8} />
                <Text variant="body2">Try again in {timeRemaining}</Text>
              </View>
            )}
          </View>
          <View style={styles.keyboard}>{keyboard()}</View>
          {isResettingPin || hideLoginWithMnemonic || (
            <>
              <Text
                variant="buttonLarge"
                onPress={handleForgotPin}
                testID="pin_or_biometry_login__signin_w_recovery"
                sx={{ alignSelf: 'center', color: '$blueMain' }}>
                Forgot PIN?
              </Text>

              <Space y={16} />
            </>
          )}
        </ReAnimated.View>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  verticalLayout: {
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  growContainer: {
    flexGrow: 1
  },
  keyboard: {
    marginHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32
  },
  dots: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    flexDirection: 'row'
  },
  pinKey: {
    flexBasis: '33%',
    padding: 16
  }
})
