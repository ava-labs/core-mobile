import { useCallback, useEffect, useState } from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import { Alert } from 'react-native'
import { InvalidVersionError, NoSaltError } from 'utils/EncryptionHelper'
import Logger from 'utils/Logger'
import { formatTimer } from 'utils/Utils'
import KeychainMigrator, {
  BadPinError,
  MigrationFailedError,
  MigrationStatus
} from 'utils/KeychainMigrator'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
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
  verified: boolean
  verifyBiometric: () => Promise<WalletLoadingResults>
  disableKeypad: boolean
  timeRemaining: string
} {
  const [enteredPin, setEnteredPin] = useState('')
  const [verified, setVerified] = useState(false)
  const [disableKeypad, setDisableKeypad] = useState(false)
  const { deleteWallet } = useDeleteWallet()
  const activeWalletId = useSelector(selectActiveWalletId)
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

        // Migrate if needed
        if (!activeWalletId) {
          throw new Error('Active wallet ID is not set')
        }
        const migrator = new KeychainMigrator(activeWalletId)
        await migrator.migrateIfNeeded('PIN', pin)

        // Load encryption key
        const isValidPin = await BiometricsSDK.loadEncryptionKeyWithPin(pin)
        if (!isValidPin) {
          throw new Error('BAD_DECRYPT')
        }

        // Success path
        setVerified(true)
        resetRateLimiter()
        onStopLoading()
      } catch (err) {
        Logger.error('Error decrypting data', err)

        const isInvalidPin =
          err instanceof Error &&
          (err?.message?.includes('BAD_DECRYPT') || // Android
            err?.message?.includes('Decrypt failed')) // iOS

        if (isInvalidPin || err instanceof BadPinError) {
          increaseAttempt()
          setVerified(false)
          onStopLoading(onWrongPin)
        } else if (
          err instanceof NoSaltError ||
          err instanceof InvalidVersionError ||
          err instanceof MigrationFailedError
        ) {
          alertBadData()
          onStopLoading()
        } else {
          onStopLoading()
        }
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
        if (!activeWalletId) {
          throw new Error('Active wallet ID is not set')
        }
        // Timer delay to give UI opportunity to draw everything
        await new Promise(resolve => setTimeout(resolve, 0))

        const accessType = BiometricsSDK.getAccessType()

        if (accessType === 'BIO') {
          // Check if migration is needed first
          const migrator = new KeychainMigrator(activeWalletId)
          const result = await migrator.migrateIfNeeded('BIO')
          if (
            result.success &&
            result.value === MigrationStatus.RunBiometricMigration
          ) {
            //already prompted user for bio, assume verified
            setVerified(true)
            resetRateLimiter()
            return new NothingToLoad()
          }
          if (
            result.success &&
            result.value !== MigrationStatus.NoMigrationNeeded
          ) {
            throw new Error(
              'Invalid state: migration status is not RunBiometricMigration'
            )
          }
          //already migrated
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
        if (err instanceof MigrationFailedError) {
          alertBadData()
        }
        setVerified(false)
        throw err
      }
    }, [activeWalletId, alertBadData, resetRateLimiter])

  return {
    enteredPin,
    onEnterPin,
    verified,
    verifyBiometric,
    disableKeypad,
    timeRemaining
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface WalletLoadingResults {}

class NothingToLoad implements WalletLoadingResults {}
