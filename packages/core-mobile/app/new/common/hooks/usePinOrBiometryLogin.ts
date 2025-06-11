import { useCallback, useEffect, useState } from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import { Alert } from 'react-native'
import { InvalidVersionError, NoSaltError } from 'utils/EncryptionHelper'
import Logger from 'utils/Logger'
import { formatTimer } from 'utils/Utils'
import { BiometricType } from 'utils/BiometricsSDK'
import KeychainMigrator from 'utils/KeychainMigrator'
import { useDeleteWallet } from './useDeleteWallet'
import { useRateLimiter } from './useRateLimiter'
import { useActiveWalletId } from './useActiveWallet'

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
  verified: boolean
  verifyBiometric: () => Promise<WalletLoadingResults>
  disableKeypad: boolean
  timeRemaining: string
  bioType: BiometricType
  isBiometricAvailable: boolean
} {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(true)
  const [bioType, setBioType] = useState<BiometricType>(BiometricType.NONE)
  const [enteredPin, setEnteredPin] = useState('')
  const [verified, setVerified] = useState(false)
  const [disableKeypad, setDisableKeypad] = useState(false)
  const { deleteWallet } = useDeleteWallet()
  const activeWalletId = useActiveWalletId()
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

  const checkEnteredPin = useCallback(
    async (pin: string) => {
      try {
        onStartLoading()

        const migrator = new KeychainMigrator(activeWalletId)
        const migrationSuccess = await migrator.migrateIfNeeded('PIN', pin)

        if (!migrationSuccess) {
          Logger.error('Migration failed')
          setVerified(false)
          increaseAttempt()
          onStopLoading(onWrongPin)
          return
        }

        // Now try to load the encryption key (either new or migrated)
        const isValidPin = await BiometricsSDK.loadEncryptionKeyWithPin(pin)
        setVerified(isValidPin)

        if (isValidPin) {
          resetRateLimiter()
        } else {
          increaseAttempt()
        }

        onStopLoading()
      } catch (err) {
        Logger.error('Error decrypting data', err)

        const isInvalidPin =
          err instanceof Error &&
          (err?.message?.includes('BAD_DECRYPT') || // Android
            err?.message?.includes('Decrypt failed')) // iOS

        if (isInvalidPin) {
          increaseAttempt()
          setVerified(false)
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
      onStartLoading,
      activeWalletId,
      onStopLoading,
      increaseAttempt,
      onWrongPin,
      resetRateLimiter,
      alertBadData
    ]
  )

  const onEnterPin = (pin: string): void => {
    if (pin.length > 6) {
      return
    }
    setEnteredPin(pin)

    if (pin.length === 6) {
      checkEnteredPin(pin).catch(Logger.error)
    }
  }

  const verifyBiometric =
    useCallback(async (): Promise<WalletLoadingResults> => {
      try {
        // Timer delay to give UI opportunity to draw everything
        await new Promise(resolve => setTimeout(resolve, 0))

        const accessType = BiometricsSDK.getAccessType()

        if (accessType === 'BIO') {
          // Check if migration is needed first
          const migrator = new KeychainMigrator(activeWalletId)
          const migrationSuccess = await migrator.migrateIfNeeded('BIO')

          if (!migrationSuccess) {
            Logger.error('Biometric migration failed')
            setVerified(false)
            return new NothingToLoad()
          }

          const isSuccess = await BiometricsSDK.loadEncryptionKeyWithBiometry()

          if (isSuccess) {
            setVerified(true)
            resetRateLimiter()
            return new NothingToLoad()
          } else {
            setVerified(false)
            return new NothingToLoad()
          }
        }

        // If not BIO access type
        setVerified(false)
        return new NothingToLoad()
      } catch (err) {
        Logger.error('Error in biometric authentication or migration', err)
        setVerified(false)
        throw err
      }
    }, [activeWalletId, resetRateLimiter])

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
    verified,
    verifyBiometric,
    disableKeypad,
    timeRemaining,
    bioType,
    isBiometricAvailable
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface WalletLoadingResults {}

class NothingToLoad implements WalletLoadingResults {}
