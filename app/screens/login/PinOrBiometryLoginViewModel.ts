import {useEffect, useState} from 'react'
import BiometricsSDK, {KeystoreConfig} from 'utils/BiometricsSDK'
import {UserCredentials} from 'react-native-keychain'
import {PinKeys} from 'screens/onboarding/PinKey'
import {asyncScheduler, Observable, of, timer} from 'rxjs'
import {catchError, concatMap, map} from 'rxjs/operators'
import {Animated} from 'react-native'
import {
  decrypt,
  EncryptedData,
  getEncryptionKey
} from 'screens/login/utils/EncryptionHelper'
import {useJigglyPinIndicator} from 'utils/JigglyPinIndicatorHook'

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

export function usePinOrBiometryLogin(): {
  title: string
  pinDots: DotView[]
  onEnterPin: (pinKey: PinKeys) => void
  mnemonic: string | undefined
  promptForWalletLoadingIfExists: () => Observable<WalletLoadingResults>
  jiggleAnim: Animated.Value
} {
  const [title] = useState('Wallet')
  const [enteredPin, setEnteredPin] = useState('')
  const [pinDots, setPinDots] = useState<DotView[]>([])
  const [pinEntered, setPinEntered] = useState(false)
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined)
  const {jiggleAnim, fireJiggleAnimation} = useJigglyPinIndicator()

  useEffect(() => {
    setPinDots(getPinDots(enteredPin))
  }, [enteredPin])

  function resetConfirmPinProcess() {
    setEnteredPin('')
    setPinEntered(false)
    setMnemonic(undefined)
  }

  useEffect(() => {
    async function checkPinEntered() {
      if (pinEntered) {
        try {
          const credentials =
            (await BiometricsSDK.loadWalletWithPin()) as UserCredentials
          const key = await getEncryptionKey(enteredPin)
          const encryptedData: EncryptedData = JSON.parse(credentials.password)
          const data = await decrypt(encryptedData, key)
          setMnemonic(data)
        } catch (err) {
          if (
            err instanceof Error &&
            (err?.message?.includes('BAD_DECRYPT') || // Android
              err?.message?.includes('Decrypt failed')) // iOS
          ) {
            resetConfirmPinProcess()
            fireJiggleAnimation()
          }
        }
      }
    }

    checkPinEntered()
  }, [pinEntered])

  const getPinDots = (pin: string): DotView[] => {
    const dots: DotView[] = []
    for (let i = 0; i < 6; i++) {
      if (i < pin.length) {
        dots.push({filled: true})
      } else {
        dots.push({filled: false})
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
      const newPin = enteredPin + keymap.get(pinKey)!
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
            return BiometricsSDK.loadWalletKey(
              KeystoreConfig.KEYSTORE_BIO_OPTIONS
            )
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
    jiggleAnim
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
