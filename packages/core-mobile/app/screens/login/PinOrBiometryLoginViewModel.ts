import { useRef, useCallback, useEffect, useState } from 'react'
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
import { useDispatch, useSelector } from 'react-redux'
import { differenceInSeconds } from 'date-fns'
import Logger from 'utils/Logger'
import { formatTimer } from 'utils/Utils'
import walletService from 'services/wallet/WalletService'
import {
  resetLoginAttempt,
  selectLoginAttempt,
  setLoginAttempt
} from 'store/security'

export type DotView = {
  filled: boolean
}

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

function getTimoutForAttempt(attempt: number): 0 | 60 | 300 | 900 | 3600 {
  if (attempt === 6) {
    return 60 // 1 minute
  } else if (attempt === 7) {
    return 300 // 5 minutes
  } else if (attempt === 8) {
    return 900 // 15 min
  } else if (attempt >= 9) {
    return 3600 // 60 minutes
  } else {
    return 0
  }
}

export function usePinOrBiometryLogin(): {
  title: string
  pinDots: DotView[]
  onEnterPin: (pinKey: PinKeys) => void
  mnemonic: string | undefined
  promptForWalletLoadingIfExists: () => Observable<WalletLoadingResults>
  jiggleAnim: Animated.Value
  disableKeypad: boolean
  timeRemaining: string
} {
  const [title] = useState('Wallet')
  const [enteredPin, setEnteredPin] = useState('')
  const [pinDots, setPinDots] = useState<DotView[]>([])
  const [pinEntered, setPinEntered] = useState(false)
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined)
  const [disableKeypad, setDisableKeypad] = useState(false)
  const { jiggleAnim, fireJiggleAnimation } = useJigglyPinIndicator()
  const { signOut } = useApplicationContext().appHook
  const loginAttempt = useSelector(selectLoginAttempt)
  const dispatch = useDispatch()
  const [time, setTime] = useState(0)
  const [resetInterval, setResetInterval] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState('00:00')
  const timerId = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    setPinDots(getPinDots(enteredPin))
  }, [enteredPin])

  // get formatted time based on time ticker and rest interval
  useEffect(() => {
    setTimeRemaining(formatTimer(resetInterval - (time % resetInterval)))
    Logger.info(`time: ${time}`)
  }, [time, resetInterval])

  const checkLoginAttempt = useCallback(
    (manualInterval?: number) => {
      const currentTimestamp = new Date()

      const secondsPassed = differenceInSeconds(
        currentTimestamp,
        loginAttempt.timestamp
      )

      const interval = manualInterval ?? resetInterval

      Logger.info(`seconds condition ${interval}`)
      Logger.info(`seconds passed ${secondsPassed}`)

      if (secondsPassed < interval) {
        setDisableKeypad(true)
      } else {
        setDisableKeypad(false)
        setTime(0)
      }
    },
    [loginAttempt, resetInterval]
  )

  // we start the timer when the keyboard is disabled
  // and stop when it's enabled & we have a timerId
  useEffect(() => {
    if (disableKeypad) {
      timerId.current = setInterval(() => {
        setTime(t => t + 1)
        checkLoginAttempt()
      }, 1000)
    }
    return () => {
      // setTime(0)
      timerId.current && clearInterval(timerId.current)
    }
  }, [checkLoginAttempt, disableKeypad])

  // triggered everytime there's login attempt,
  // but we only care if it's over the 5th try
  useEffect(() => {
    if (loginAttempt.count > 5) {
      const interval = getTimoutForAttempt(loginAttempt.count)
      setResetInterval(interval)
      checkLoginAttempt(interval)
    }
  }, [loginAttempt, setResetInterval, checkLoginAttempt])

  // 1 time check to set things up
  // used for when the app gets killed, and
  // we need to restore the timer
  useEffect(() => {
    if (loginAttempt.count > 5) {
      const interval = getTimoutForAttempt(loginAttempt.count)
      setResetInterval(interval)
      const currentTimestamp = new Date()
      const secondsPassed = differenceInSeconds(
        currentTimestamp,
        loginAttempt.timestamp
      )
      if (secondsPassed !== 0 && time === 0) {
        setTime(secondsPassed)
      }
    }
  }, [
    setTime,
    setResetInterval,
    loginAttempt.count,
    loginAttempt.timestamp,
    time
  ])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  function resetConfirmPinProcess(): void {
    setEnteredPin('')
    setPinEntered(false)
    setMnemonic(undefined)
  }

  useEffect(() => {
    async function checkPinEntered(): Promise<void> {
      if (!pinEntered || walletService.getWalletType() === 'seedless') return

      try {
        const credentials =
          (await BiometricsSDK.loadWalletWithPin()) as UserCredentials

        const { data, version } = await decrypt(
          credentials.password,
          enteredPin
        )

        if (version === 1) {
          // data was encrypted using version 1 config
          // we need to re-encrypt it using version 2 config
          // and store it again
          const encryptedData = await encrypt(data, enteredPin)
          await BiometricsSDK.storeWalletWithPin(encryptedData, false)
        }

        setMnemonic(data)
        dispatch(resetLoginAttempt())
      } catch (err) {
        Logger.error('Error decrypting data', err)

        const isInvalidPin =
          err instanceof Error &&
          (err?.message?.includes('BAD_DECRYPT') || // Android
            err?.message?.includes('Decrypt failed')) // iOS

        if (isInvalidPin) {
          dispatch(
            setLoginAttempt({
              count: loginAttempt.count + 1,
              timestamp: Date.now()
            })
          )
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

    checkPinEntered()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinEntered])

  const getPinDots = (pin: string): DotView[] => {
    const dots: DotView[] = []
    for (let i = 0; i < 6; i++) {
      if (i < pin.length) {
        dots.push({ filled: true })
      } else {
        dots.push({ filled: false })
      }
    }
    return dots
  }

  const onEnterPin = (pinKey: PinKeys): void => {
    if (pinKey === PinKeys.Backspace) {
      setEnteredPin(enteredPin.slice(0, -1))
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
        concatMap(() => BiometricsSDK.getAccessType()),
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
              return new PrivateKeyLoaded(keyOrMnemonic)
            } else {
              setMnemonic(keyOrMnemonic)
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
    title,
    pinDots,
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

export class MnemonicLoaded implements WalletLoadingResults {
  mnemonic: string

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic
  }
}

export class PrivateKeyLoaded implements WalletLoadingResults {
  privateKey: string

  constructor(privateKey: string) {
    this.privateKey = privateKey
  }
}

export class NothingToLoad implements WalletLoadingResults {}
