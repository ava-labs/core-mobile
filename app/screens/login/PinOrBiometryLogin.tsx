import React, { useEffect } from 'react'
import {
  Animated,
  InteractionManager,
  Keyboard,
  StyleSheet,
  View
} from 'react-native'
import PinKey, { PinKeys } from 'screens/onboarding/PinKey'
import { Space } from 'components/Space'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaButton from 'components/AvaButton'
import DotSVG from 'components/svg/DotSVG'
import CoreXLogoAnimated from 'components/CoreXLogoAnimated'
import AvaText from 'components/AvaText'
import { Subscription } from 'rxjs'
import {
  MnemonicLoaded,
  NothingToLoad,
  PrivateKeyLoaded,
  usePinOrBiometryLogin,
  WalletLoadingResults
} from './PinOrBiometryLoginViewModel'

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

type Props = {
  onSignInWithRecoveryPhrase: () => void
  onLoginSuccess: (mnemonic: string) => void
  isResettingPin?: boolean
  hideLoginWithMnemonic?: boolean
}

/**
 * This screen will select appropriate login method (pin or biometry) and call onLoginSuccess upon successful login.
 * @param onSignInWithRecoveryPhrase
 * @param onLoginSuccess
 * @param isResettingPin
 * @param hideLoginWithMnemonic
 * @constructor
 */
export default function PinOrBiometryLogin({
  onSignInWithRecoveryPhrase,
  onLoginSuccess,
  isResettingPin,
  hideLoginWithMnemonic = false
}: Props | Readonly<Props>): JSX.Element {
  const theme = useApplicationContext().theme

  const {
    pinDots,
    onEnterPin,
    mnemonic,
    promptForWalletLoadingIfExists,
    jiggleAnim,
    disableKeypad,
    timeRemaining
  } = usePinOrBiometryLogin()

  useEffect(() => {
    Keyboard.dismiss()
  }, [])

  useEffect(() => {
    let sub: Subscription

    // check if if the login is biometric
    InteractionManager.runAfterInteractions(() => {
      sub = promptForWalletLoadingIfExists().subscribe({
        next: (value: WalletLoadingResults) => {
          if (value instanceof MnemonicLoaded) {
            // do nothing. We only rely on `setMnemonic` being called
            // and the useEffect being triggered.
          } else if (value instanceof PrivateKeyLoaded) {
            // props.onEnterSingletonWallet(value.privateKey)
          } else if (value instanceof NothingToLoad) {
            //do nothing
          }
        },
        error: err => console.log(err.message)
      })
    })

    return () => sub?.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (mnemonic) {
      onLoginSuccess(mnemonic)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mnemonic])

  const generatePinDots = (): Element[] => {
    const dots: Element[] = []

    pinDots.forEach((value, key) => {
      dots.push(
        <DotSVG
          fillColor={value.filled ? theme.alternateBackground : undefined}
          key={key}
        />
      )
    })
    return dots
  }

  const keyboard = () => {
    const keys: Element[] = []
    '123456789 0<'.split('').forEach((value, key) => {
      keys.push(
        <View key={key} style={styles.pinKey}>
          <PinKey
            keyboardKey={keymap.get(value) as PinKeys}
            onPress={onEnterPin}
            disabled={disableKeypad}
          />
        </View>
      )
    })
    return keys
  }

  return (
    <View
      style={[styles.verticalLayout, { backgroundColor: theme.background }]}>
      <Space y={64} />
      <View style={styles.growContainer}>
        {isResettingPin || (
          <View style={{ alignItems: 'center' }}>
            <CoreXLogoAnimated size={100} />
          </View>
        )}
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
            <AvaText.Heading3>Login Disabled</AvaText.Heading3>
            <Space y={8} />
            <AvaText.Body2>Try again in {timeRemaining}</AvaText.Body2>
          </View>
        )}
      </View>
      <View style={styles.keyboard}>{keyboard()}</View>
      {isResettingPin || hideLoginWithMnemonic || (
        <>
          <AvaButton.TextMedium onPress={onSignInWithRecoveryPhrase}>
            Sign In with recovery phrase
          </AvaButton.TextMedium>
          <Space y={16} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  verticalLayout: {
    height: '100%',
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
