import { useCallback, useEffect, useState } from 'react'
import BiometricsSDK, { KeystoreConfig } from 'utils/BiometricsSDK'
import { UserCredentials } from 'react-native-keychain'
import { PinKeys } from 'screens/onboarding/PinKey'
import { asyncScheduler, Observable, of, timer } from 'rxjs'
import { catchError, concatMap, map } from 'rxjs/operators'
import { Alert, Animated } from 'react-native'
import {
  decrypt,
  encrypt,
  InvalidVersionError,
  NoSaltError
} from 'utils/EncryptionHelper'
import { useJigglyPinIndicator } from 'utils/JigglyPinIndicatorHook'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Logger from 'utils/Logger'
import { useRateLimiter } from 'screens/login/hooks/useRateLimiter'
import { formatTimer } from 'utils/Utils'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
import { storeWalletWithPin } from 'store/wallet/thunks'
import { WalletType } from 'services/wallet/types'

const keymap: Map<PinKeys, string> = new Map([
  [PinKeys.Key1, '1'],
  [PinKeys.Key2, '2'],
  [PinKeys.Key3, '3'],
  [PinKeys.Key4, '4'],
  [PinKeys.Key5, '5'],
  [PinKeys.Key6, '6'],
  [PinKeys.Key7, '7'],
  [PinKeys.Key8, '8'],
  [PinKeys.Key9, '9'],
  [PinKeys.Key0, '0']
])

export function usePinOrBiometryLogin(): {
  pinLength: number
  onEnterPin: (pinKey: PinKeys) => void
  mnemonic: string | undefined
  promptForWalletLoadingIfExists: () => Observable<WalletLoadingResults>
  jiggleAnim: Animated.Value
  disableKeypad: boolean
  timeRemaining: string
} {
  const [enteredPin, setEnteredPin] = useState('')
  const [pinEntered, setPinEntered] = useState(false)
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined)
  const [disableKeypad, setDisableKeypad] = useState(false)
  const { jiggleAnim, fireJiggleAnimation } = useJigglyPinIndicator()
  const { signOut } = useApplicationContext().appHook
  const [timeRemaining, setTimeRemaining] = useState('00:00')
  const activeWalletId = useSelector(selectActiveWalletId)
  const dispatch = useDispatch()

  const {
    increaseAttempt,
    attemptAllowed,
    reset: resetRateLimiter,
    remainingSeconds
  } = useRateLimiter()

  // get formatted time based on time ticker and rest interval
  useEffect(() => {
    setTimeRemaining(formatTimer(remainingSeconds))
  }, [remainingSeconds])

  useEffect(() => {
    setDisableKeypad(!attemptAllowed)
  }, [attemptAllowed])

  const alertBadData = useCallback(
    () =>
      Alert.alert(
        'Data is not encrypted correctly',
        'Please set up the wallet again!',
        [
          {
            text: 'Okay',
            onPress: signOut
          }
        ],
        { cancelable: false }
      ),
    [signOut]
  )

  const resetConfirmPinProcess = useCallback(() => {
    setEnteredPin('')
    setMnemonic(undefined)
  }, [])

  useEffect(() => {
    async function checkPinEntered(): Promise<void> {
      if (!pinEntered) {
        return
      }
      setPinEntered(false)

      try {
        if (!activeWalletId) {
          throw new Error('Active wallet ID not found')
        }
        const credentials = (await BiometricsSDK.loadWalletWithPin(
          activeWalletId
        )) as UserCredentials

        const { data, version } = await decrypt(
          credentials.password,
          enteredPin
        )

        if (version === 1) {
          // data was encrypted using version 1 config
          // we need to re-encrypt it using version 2 config
          // and store it again
          const encryptedData = await encrypt(data, enteredPin)
          const dispatchStoreWalletWithPin = dispatch(
            storeWalletWithPin({
              walletId: activeWalletId,
              encryptedWalletKey: encryptedData,
              isResetting: false,
              type: WalletType.MNEMONIC
            })
          )
          // @ts-ignore
          await dispatchStoreWalletWithPin.unwrap()
        }

        setMnemonic(data)
        resetRateLimiter()
      } catch (err) {
        Logger.error('Error decrypting data', err)

        const isInvalidPin =
          err instanceof Error &&
          (err?.message?.includes('BAD_DECRYPT') || // Android
            err?.message?.includes('Decrypt failed')) // iOS

        if (isInvalidPin) {
          increaseAttempt()
          resetConfirmPinProcess()
          fireJiggleAnimation()
        } else if (
          err instanceof NoSaltError ||
          err instanceof InvalidVersionError
        ) {
          alertBadData()
        }
      }
    }

    checkPinEntered().catch(Logger.error)
  }, [
    alertBadData,
    enteredPin,
    fireJiggleAnimation,
    increaseAttempt,
    pinEntered,
    resetConfirmPinProcess,
    resetRateLimiter,
    activeWalletId,
    dispatch
  ])

  const onEnterPin = (pinKey: PinKeys): void => {
    if (pinKey === PinKeys.Backspace) {
      const pin = enteredPin.slice(0, -1)
      setEnteredPin(pin)
    } else {
      if (enteredPin.length === 6) {
        return
      }
      const newPin = enteredPin + keymap.get(pinKey)
      setEnteredPin(newPin)
      if (newPin.length === 6) {
        setPinEntered(true)
      }
    }
  }

  const promptForWalletLoadingIfExists =
    (): Observable<WalletLoadingResults> => {
      return timer(0, asyncScheduler).pipe(
        //timer is here to give UI opportunity to draw everything
        concatMap(() => of(BiometricsSDK.getAccessType())),
        concatMap((value: string | null) => {
          if (value === 'BIO' && activeWalletId) {
            return BiometricsSDK.loadWalletKey(activeWalletId, {
              ...KeystoreConfig.KEYSTORE_BIO_OPTIONS,
              authenticationPrompt: {
                title: 'Access Wallet',
                subtitle:
                  'Use biometric data to access securely stored wallet information',
                cancel: 'cancel'
              }
            })
          }
          return of(false)
        }),
        map((value: boolean | UserCredentials) => {
          if (value !== false) {
            const keyOrMnemonic = (value as UserCredentials).password
            if (keyOrMnemonic.startsWith('PrivateKey')) {
              resetRateLimiter()
              return new PrivateKeyLoaded(keyOrMnemonic)
            } else {
              setMnemonic(keyOrMnemonic)
              resetRateLimiter()
              return new NothingToLoad()
            }
          } else {
            return new NothingToLoad()
          }
        }),
        catchError(err => {
          throw err
        })
      )
    }

  return {
    pinLength: enteredPin.length,
    onEnterPin,
    mnemonic,
    promptForWalletLoadingIfExists,
    jiggleAnim,
    disableKeypad,
    timeRemaining
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WalletLoadingResults {}

export class PrivateKeyLoaded implements WalletLoadingResults {
  privateKey: string

  constructor(privateKey: string) {
    this.privateKey = privateKey
  }
}

export class NothingToLoad implements WalletLoadingResults {}
