import { useCallback, useEffect, useState } from 'react'
import BiometricsSDK, {
  BiometricType,
  KeystoreConfig
} from 'utils/BiometricsSDK'
import { UserCredentials } from 'react-native-keychain'
import { asyncScheduler, Observable, of, timer } from 'rxjs'
import { catchError, concatMap, map } from 'rxjs/operators'
import { Alert } from 'react-native'
import {
  decrypt,
  encrypt,
  InvalidVersionError,
  NoSaltError
} from 'utils/EncryptionHelper'
import Logger from 'utils/Logger'
import { formatTimer } from 'utils/Utils'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { storeWalletWithPin } from 'store/wallet/thunks'
import { useDeleteWallet } from './useDeleteWallet'
import { useRateLimiter } from './useRateLimiter'
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
  bioType: BiometricType
  isBiometricAvailable: boolean
} {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(true)
  const [bioType, setBioType] = useState<BiometricType>(BiometricType.NONE)
  const dispatch = useDispatch()
  const activeWalletId = useSelector(selectActiveWalletId)
  const [enteredPin, setEnteredPin] = useState('')
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined)
  const [disableKeypad, setDisableKeypad] = useState(false)
  const { deleteWallet } = useDeleteWallet()
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
            onPress: deleteWallet
          }
        ],
        { cancelable: false }
      ),
    [deleteWallet]
  )

  const checkPinEntered = useCallback(
    async (pin: string) => {
      if (!activeWalletId) {
        Logger.error('No active wallet ID found')
        return
      }

      try {
        onStartLoading()
        const credentials = (await BiometricsSDK.loadWalletWithPin(
          activeWalletId
        )) as UserCredentials

        const { data, version } = await decrypt(credentials.password, pin)

        if (version === 1) {
          // data was encrypted using version 1 config
          // we need to re-encrypt it using version 2 config
          // and store it again
          const encryptedData = await encrypt(data, pin)
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
      onStopLoading,
      activeWalletId,
      dispatch
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
      if (!activeWalletId) {
        Logger.error('No active wallet ID found')
        return of(new NothingToLoad())
      }

      return timer(0, asyncScheduler).pipe(
        //timer is here to give UI opportunity to draw everything
        concatMap(() => of(BiometricsSDK.getAccessType())),
        concatMap((value: string | null) => {
          if (value && value === 'BIO') {
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
    }, [resetRateLimiter, activeWalletId])

  useEffect(() => {
    async function getBiometryType(): Promise<void> {
      const canUseBiometry = await BiometricsSDK.canUseBiometry()
      setIsBiometricAvailable(canUseBiometry)

      if (!canUseBiometry || BiometricsSDK.getAccessType() !== 'BIO') {
        return
      }

      const type = await BiometricsSDK.getBiometryType()
      setBioType(type)
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
    bioType,
    isBiometricAvailable
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
