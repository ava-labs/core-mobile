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

  // The keychain no longer holds any credential that could unlock this wallet
  // (e.g. an interrupted wallet deletion wiped it while persisted redux state
  // survived). Recovery deletes the stale wallet and routes to onboarding, but
  // always behind an explicit acknowledgment — this hook also backs in-session
  // verification flows (VerifyPin, VerifyWithPinOrBiometry), where silently
  // landing the user in onboarding would be jarring. (CP-14585)
  const alertMissingWalletData = useCallback(
    () =>
      Alert.alert(
        'Wallet data not found',
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

  // Runs the keychain migration for a PIN login. Returns true when the
  // keychain holds no wallet credential at all (new or legacy) and recovery
  // was triggered — without this check the migrator would try a legacy
  // migration, find nothing, and report an endless "wrong PIN". (CP-14585)
  const migrateDetectingWipedKeychain = useCallback(
    async (walletId: string, pin: string): Promise<boolean> => {
      const migrator = new KeychainMigrator(walletId)
      const migrationResult = await migrator.migrateIfNeeded('PIN', pin)
      if (
        migrationResult.success &&
        migrationResult.value === MigrationStatus.NoKeychainData
      ) {
        Logger.error(
          'No keychain wallet data on PIN entry; recovering to onboarding',
          new Error('no-keychain-data')
        )
        onStopLoading()
        alertMissingWalletData()
        return true
      }
      return false
    },
    [onStopLoading, alertMissingWalletData]
  )

  // Handles a missing PIN encryption key ('no-credentials'). Reachable from
  // the in-session flows that skip migration (PinScreenOverlay, VerifyPin) or
  // a race against an ongoing deletion — the initial-login path is normally
  // intercepted by the NoKeychainData check. Only recovers when the keychain
  // is provably empty: if any other credential exists (e.g. the bio key of a
  // partially completed biometric migration, or legacy entries), the wallet
  // is still recoverable and deleting it would destroy real data — that case
  // surfaces as a failed PIN check instead, matching pre-CP-14585 behavior.
  // The probe is strict: a transient failure throws (non-destructive) rather
  // than reading as an empty keychain. (CP-14585)
  const handleMissingEncryptionKey = useCallback(async (): Promise<void> => {
    if (await BiometricsSDK.hasAnyWalletData()) {
      throw new BadPinError({
        message: 'Encryption key missing but other wallet data exists'
      })
    }
    Logger.error(
      'Encryption key missing on PIN entry; recovering to onboarding',
      new Error('no-credentials')
    )
    onStopLoading()
    alertMissingWalletData()
  }, [onStopLoading, alertMissingWalletData])

  const checkEnteredPin = useCallback(
    async (pin: string) => {
      try {
        onStartLoading()

        // Migrate if needed
        if (!activeWalletId) {
          throw new Error('Active wallet ID is not set')
        }

        if (isInitialLogin) {
          const recovered = await migrateDetectingWipedKeychain(
            activeWalletId,
            pin
          )
          if (recovered) {
            return
          }
        }

        // Load encryption key
        const pinResult = await BiometricsSDK.loadEncryptionKeyWithPin(pin)

        if (pinResult === 'no-credentials') {
          await handleMissingEncryptionKey()
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
      handleMissingEncryptionKey,
      migrateDetectingWipedKeychain
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
              result.value === MigrationStatus.NoKeychainData
            ) {
              // Nothing in the keychain can unlock this wallet — same
              // recovery as the PIN path. (CP-14585)
              Logger.error(
                'No keychain wallet data on biometric login; recovering to onboarding',
                new Error('no-keychain-data')
              )
              alertMissingWalletData()
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
      alertMissingWalletData,
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
