import { useCallback, useEffect, useState } from 'react'
import BiometricsSDK from 'utils/BiometricsSDK'
import { Alert } from 'react-native'
import { InvalidVersionError, NoSaltError } from 'utils/EncryptionHelper'
import Logger from 'utils/Logger'
import { formatTimer } from 'utils/Utils'
import { BiometricType } from 'utils/BiometricsSDK'
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
  onWrongPin,
  isInitialLogin = false,
  onBiometricPrompt
}: {
  onStartLoading: () => void
  onStopLoading: (onComplete?: () => void) => void
  onWrongPin: () => void
  isInitialLogin?: boolean
  onBiometricPrompt: () => Promise<boolean>
}): {
  enteredPin: string
  onEnterPin: (pinKey: string) => void
  verified: boolean
  resetLoginState: () => void
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

        if (isInitialLogin) {
          const migrator = new KeychainMigrator(activeWalletId)
          await migrator.migrateIfNeeded('PIN', pin)
        }

        // Load encryption key
        const pinResult = await BiometricsSDK.loadEncryptionKeyWithPin(pin)

        if (pinResult === 'no-credentials') {
          // The encryption key is gone (e.g. an interrupted wallet deletion),
          // so no PIN can ever unlock this wallet. Recover by deleting the
          // stale wallet and routing to onboarding instead of reporting an
          // endless "wrong PIN". (CP-14585)
          Logger.error(
            'Encryption key missing on PIN entry; deleting wallet',
            new Error('no-credentials')
          )
          onStopLoading()
          deleteWallet()
          return
        }

        if (pinResult === 'wrong-pin') {
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
      isInitialLogin,
      resetRateLimiter,
      onStopLoading,
      increaseAttempt,
      onWrongPin,
      alertBadData,
      deleteWallet
    ]
  )

  // Clears the sticky `verified` flag and the entered PIN so a subsequent
  // PIN/biometry check re-triggers the login effect from a clean slate. Used by
  // callers to recover after a post-verification login failure (e.g. transient
  // secret load / unlock) instead of leaving the user stuck. (CP-14585)
  const resetLoginState = useCallback(() => {
    setVerified(false)
    setEnteredPin('')
  }, [])

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
    // eslint-disable-next-line sonarjs/cognitive-complexity
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

          if (isInitialLogin) {
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
          }
          //already migrated
          try {
            const isSuccess = await onBiometricPrompt()
            if (isSuccess) {
              setVerified(true)
              resetRateLimiter()
              return new NothingToLoad()
            } else {
              setVerified(false)
              return new NothingToLoad()
            }
          } catch (err) {
            Logger.error('Error in biometric authentication', err)
            setVerified(false)

            // Check for cancellation error in various formats
            const isCanceled =
              (err instanceof Error &&
                err.message?.toLowerCase().includes('cancel')) ||
              (Array.isArray(err) &&
                err.some(
                  e =>
                    e instanceof Error &&
                    e.message?.toLowerCase().includes('cancel')
                )) ||
              (err &&
                typeof err === 'object' &&
                'message' in err &&
                String(err.message).toLowerCase().includes('cancel')) ||
              (err && String(err).toLowerCase().includes('cancel'))

            if (!isCanceled) {
              setIsBiometricAvailable(false)
              setBioType(BiometricType.NONE)
            }
            throw err
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
    }, [
      activeWalletId,
      alertBadData,
      resetRateLimiter,
      isInitialLogin,
      onBiometricPrompt
    ])

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
    resetLoginState,
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
