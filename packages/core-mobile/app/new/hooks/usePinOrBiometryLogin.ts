import { useCallback, useEffect, useState } from 'react'
import BiometricsSDK, { KeystoreConfig } from 'utils/BiometricsSDK'
import { BIOMETRY_TYPE, UserCredentials } from 'react-native-keychain'
import { asyncScheduler, Observable, of, timer } from 'rxjs'
import { catchError, concatMap, map } from 'rxjs/operators'
import { Alert } from 'react-native'
import {
  decrypt,
  encrypt,
  InvalidVersionError,
  NoSaltError
} from 'utils/EncryptionHelper'
import { useApplicationContext } from 'contexts/ApplicationContext'
import Logger from 'utils/Logger'
import { useRateLimiter } from 'screens/login/hooks/useRateLimiter'
import { formatTimer } from 'utils/Utils'

export function usePinOrBiometryLogin({
  onStartLoading,
  onStopLoading,
  onWrongPin
}: {
  onStartLoading: () => void
  onStopLoading: (onComplete?: () => void) => void
  onWrongPin: () => void
}): {
  enteredPin: string
  onEnterPin: (pinKey: string) => void
  mnemonic: string | undefined
  promptForWalletLoadingIfExists: () => Observable<WalletLoadingResults>
  disableKeypad: boolean
  timeRemaining: string
  bioType: 'Face' | 'Fingerprint' | undefined
} {
  const [enteredPin, setEnteredPin] = useState('')
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined)
  const [disableKeypad, setDisableKeypad] = useState(false)
  const { signOut } = useApplicationContext().appHook
  const [timeRemaining, setTimeRemaining] = useState('00:00')
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

  useEffect(() => {
    setEnteredPin('')
  }, [disableKeypad])

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

  const checkPinEntered = useCallback(
    async (pin: string) => {
      try {
        onStartLoading()
        const credentials =
          (await BiometricsSDK.loadWalletWithPin()) as UserCredentials

        const { data, version } = await decrypt(credentials.password, pin)

        if (version === 1) {
          // data was encrypted using version 1 config
          // we need to re-encrypt it using version 2 config
          // and store it again
          const encryptedData = await encrypt(data, pin)
          await BiometricsSDK.storeWalletWithPin(encryptedData, false)
        }

        setMnemonic(data)
        resetRateLimiter()

        onStopLoading()
      } catch (err) {
        Logger.error('Error decrypting data', err)

        const isInvalidPin =
          err instanceof Error &&
          (err?.message?.includes('BAD_DECRYPT') || // Android
            err?.message?.includes('Decrypt failed')) // iOS

        if (isInvalidPin) {
          increaseAttempt()
          setMnemonic(undefined)
        } else if (
          err instanceof NoSaltError ||
          err instanceof InvalidVersionError
        ) {
          alertBadData()
        }

        onStopLoading(isInvalidPin ? onWrongPin : undefined)
      }
    },
    [
      alertBadData,
      increaseAttempt,
      resetRateLimiter,
      onWrongPin,
      onStartLoading,
      onStopLoading
    ]
  )

  const onEnterPin = (pin: string): void => {
    if (pin.length > 6) {
      return
    }
    setEnteredPin(pin)

    if (pin.length === 6) {
      checkPinEntered(pin).catch(Logger.error)
    }
  }

  const promptForWalletLoadingIfExists =
    useCallback((): Observable<WalletLoadingResults> => {
      return timer(0, asyncScheduler).pipe(
        //timer is here to give UI opportunity to draw everything
        concatMap(() => of(BiometricsSDK.getAccessType())),
        concatMap((value: string | null) => {
          if (value && value === 'BIO') {
            return BiometricsSDK.loadWalletKey({
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
    }, [resetRateLimiter])

  const [bioType, setBioType] = useState<BioType>()

  useEffect(() => {
    async function getBiometryType(): Promise<void> {
      if (
        !BiometricsSDK.canUseBiometry() ||
        BiometricsSDK.getAccessType() !== 'BIO'
      ) {
        return
      }

      const type = await BiometricsSDK.getBiometryType()

      if (type === BIOMETRY_TYPE.FACE || type === BIOMETRY_TYPE.FACE_ID) {
        setBioType('Face')
      } else if (type === BIOMETRY_TYPE.FINGERPRINT) {
        setBioType('Fingerprint')
      }
    }

    getBiometryType()
  }, [])

  return {
    enteredPin,
    onEnterPin,
    mnemonic,
    promptForWalletLoadingIfExists,
    disableKeypad,
    timeRemaining,
    bioType
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface WalletLoadingResults {}

class PrivateKeyLoaded implements WalletLoadingResults {
  privateKey: string

  constructor(privateKey: string) {
    this.privateKey = privateKey
  }
}

class NothingToLoad implements WalletLoadingResults {}

type BioType = 'Face' | 'Fingerprint'