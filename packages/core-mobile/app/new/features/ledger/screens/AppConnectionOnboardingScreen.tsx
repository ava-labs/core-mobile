import React, { useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import Logger from 'utils/Logger'
import { Alert } from 'react-native'
import LedgerService from 'services/ledger/LedgerService'
import {
  LedgerDerivationPathType,
  LedgerMultiIndexKeys,
  PublicKeyInfo
} from 'services/ledger/types'
import { useRouter } from 'expo-router'
import { useLedgerWallet } from '../hooks/useLedgerWallet'
import { useLedgerSetupContext } from '../contexts/LedgerSetupContext'
import { useSetLedgerAddress } from '../hooks/useSetLedgerAddress'
import { useCheckIfLedgerWalletExists } from '../hooks/useCheckIfLedgerWalletExists'
import AppConnectionScreen from './AppConnectionScreen'

interface AppConnectionOnboardingScreenProps {
  onNavigateToComplete: (walletId?: string) => void
  showConnectionToasts: boolean
  showCancelOnComplete: boolean
}

export const AppConnectionOnboardingScreen = ({
  onNavigateToComplete,
  showConnectionToasts,
  showCancelOnComplete
}: AppConnectionOnboardingScreenProps): JSX.Element => {
  const { createLedgerWallet } = useLedgerWallet()
  const { setLedgerAddress } = useSetLedgerAddress()
  const checkIfLedgerWalletExists = useCheckIfLedgerWalletExists()
  const { canGoBack, back } = useRouter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  // useRef instead of useState: the ref flips synchronously, so a second tap
  // cannot enter handleComplete before the first invocation finishes. useState
  // is async — rapid taps could race past the isUpdatingWallet guard before
  // React re-renders with the updated value.
  const isHandlingCompleteRef = useRef(false)

  const {
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    disconnectDevice,
    isUpdatingWallet,
    setIsUpdatingWallet
  } = useLedgerSetupContext()

  const handleCancel = useCallback(async () => {
    await disconnectDevice().catch(error => {
      Logger.error('Failed to disconnect Ledger device on cancel', error)
    })
    canGoBack() && back()
  }, [disconnectDevice, canGoBack, back])

  const handleComplete = useCallback(
    async (multiIndexKeys: LedgerMultiIndexKeys) => {
      if (isHandlingCompleteRef.current) return
      isHandlingCompleteRef.current = true

      // Account 0's keys are at index 0 in the multi-index map.
      // Additional indices hold xpubs/pubkeys that will be used for
      // background discovery after onboarding completes.
      const index0Mainnet = multiIndexKeys.mainnet[0]
      const index0Testnet = multiIndexKeys.testnet[0]
      // Use current network's keys for the Account object (matches add-account behavior)
      const index0Current = isDeveloperMode ? index0Testnet : index0Mainnet

      Logger.info('handleComplete called', {
        hasAccount0Keys: !!index0Current?.avalancheKeys,
        totalIndices: Object.keys(multiIndexKeys.mainnet).length,
        hasConnectedDeviceId: !!connectedDeviceId,
        hasSelectedDerivationPath: !!selectedDerivationPath,
        isUpdatingWallet
      })

      // Fall back to BIP44 if context was reset (e.g. after a prior import)
      const derivationPath =
        selectedDerivationPath ?? LedgerDerivationPathType.BIP44

      // If the wallet was already imported (e.g. user went back from naming
      // screen and tapped Complete setup again), just navigate forward.
      if (
        connectedDeviceId &&
        checkIfLedgerWalletExists(connectedDeviceId, derivationPath)
      ) {
        Logger.info('Ledger wallet already exists, skipping duplicate import')
        LedgerService.stopAppPolling()
        isHandlingCompleteRef.current = false
        onNavigateToComplete()
        return
      }

      if (
        !index0Current?.avalancheKeys ||
        !connectedDeviceId ||
        isUpdatingWallet
      ) {
        Logger.error('Ledger wallet creation conditions not met', {
          hasAccount0Keys: !!index0Mainnet?.avalancheKeys,
          hasConnectedDeviceId: !!connectedDeviceId,
          hasSelectedDerivationPath: !!selectedDerivationPath,
          isUpdatingWallet
        })
        isHandlingCompleteRef.current = false
        Alert.alert(
          'Wallet setup failed',
          'Unable to complete Ledger wallet setup. Please restart the setup process.',
          [{ text: 'OK', onPress: handleCancel }]
        )
        return
      }

      Logger.info('Creating wallet with account 0...')
      setIsUpdatingWallet(true)

      try {
        // Create wallet with account 0 only — fast path.
        // The wallet secret includes xpubs for indices 1-9 so background
        // discovery can derive addresses and create accounts later.
        const { additionalXpubs, additionalPublicKeys, solanaAddresses } =
          buildAdditionalData(multiIndexKeys)

        const { walletId, accountId } = await createLedgerWallet({
          deviceId: connectedDeviceId,
          deviceName: connectedDeviceName,
          derivationPathType: derivationPath,
          avalancheKeys: index0Current.avalancheKeys,
          solanaKeys: index0Current.solanaKeys,
          // Pass xpubs, public keys, + Solana addresses for background discovery
          additionalXpubs,
          additionalPublicKeys,
          additionalSolanaAddresses: solanaAddresses
        })

        // Store ledger addresses for account 0 (mainnet + testnet)
        await setLedgerAddress({
          accountIndex: 0,
          walletId,
          accountId,
          keys: {
            mainnet: index0Mainnet ?? {
              solanaKeys: [],
              avalancheKeys: undefined
            },
            testnet: index0Testnet ?? {
              solanaKeys: [],
              avalancheKeys: undefined
            }
          }
        })

        LedgerService.stopAppPolling()
        onNavigateToComplete(walletId)
      } catch (error) {
        Logger.error('Wallet creation failed', error)
        Alert.alert(
          'Wallet creation failed',
          error instanceof Error
            ? error.message
            : 'Failed to create Ledger wallet. Please try again.',
          [{ text: 'OK', onPress: handleCancel }]
        )
      } finally {
        setIsUpdatingWallet(false)
        isHandlingCompleteRef.current = false
      }
    },
    [
      connectedDeviceId,
      selectedDerivationPath,
      isUpdatingWallet,
      setIsUpdatingWallet,
      createLedgerWallet,
      connectedDeviceName,
      setLedgerAddress,
      isDeveloperMode,
      onNavigateToComplete,
      handleCancel,
      checkIfLedgerWalletExists
    ]
  )

  return (
    <AppConnectionScreen
      selectedDerivationPath={
        selectedDerivationPath ?? LedgerDerivationPathType.BIP44
      }
      completeStepTitle={`Your Ledger wallet\nis being set up`}
      handleComplete={handleComplete}
      deviceId={connectedDeviceId}
      deviceName={connectedDeviceName}
      isUpdatingWallet={isUpdatingWallet}
      handleCancel={handleCancel}
      accountIndex={0}
      showProgressDots={false}
      showConnectionToasts={showConnectionToasts}
      showCancelOnComplete={showCancelOnComplete}
    />
  )
}

/**
 * Extract xpubs, public keys, and Solana addresses for indices 1-9 from the
 * multi-index keys, to be stored in the wallet secret for background discovery.
 *
 * BIP44 wallets use xpubs for offline derivation.
 * LedgerLive wallets use raw public keys (no xpubs available).
 */
function buildAdditionalData(multiIndexKeys: LedgerMultiIndexKeys): {
  additionalXpubs: Record<number, { evm: string; avalanche: string }>
  additionalPublicKeys: Record<number, PublicKeyInfo[]>
  solanaAddresses: Record<number, string>
} {
  const additionalXpubs: Record<number, { evm: string; avalanche: string }> = {}
  const additionalPublicKeys: Record<number, PublicKeyInfo[]> = {}
  const solanaAddresses: Record<number, string> = {}

  Object.entries(multiIndexKeys.mainnet).forEach(([indexStr, keys]) => {
    const index = Number(indexStr)
    if (index === 0) return // Account 0 is stored by createLedgerWallet

    if (keys.avalancheKeys?.xpubs) {
      additionalXpubs[index] = {
        evm: keys.avalancheKeys.xpubs.evm,
        avalanche: keys.avalancheKeys.xpubs.avalanche
      }
    }

    if (keys.avalancheKeys?.publicKeys) {
      const pubKeys: PublicKeyInfo[] = [...keys.avalancheKeys.publicKeys]
      const solKey = keys.solanaKeys?.[0]
      if (solKey) {
        pubKeys.push(solKey)
      }
      additionalPublicKeys[index] = pubKeys
    }

    const solKey = keys.solanaKeys?.[0]?.key
    if (solKey) {
      solanaAddresses[index] = solKey
    }
  })

  return { additionalXpubs, additionalPublicKeys, solanaAddresses }
}
