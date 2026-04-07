import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import Logger from 'utils/Logger'
import { Alert } from 'react-native'
import LedgerService from 'services/ledger/LedgerService'
import {
  LedgerDerivationPathType,
  LedgerMultiIndexKeys,
  PublicKeyInfo
} from 'services/ledger/types'
import { useRouter } from 'expo-router'
import { WalletType } from 'services/wallet/types'
import { onWalletImported } from 'store/app/slice'
import { useLedgerWallet } from '../hooks/useLedgerWallet'
import { useLedgerSetupContext } from '../contexts/LedgerSetupContext'
import { useSetLedgerAddress } from '../hooks/useSetLedgerAddress'
import AppConnectionScreen from './AppConnectionScreen'

interface AppConnectionOnboardingScreenProps {
  onNavigateToComplete: () => void
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
  const { canGoBack, back } = useRouter()
  const dispatch = useDispatch()

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
      // Account 0's keys are at index 0 in the multi-index map.
      // Additional indices hold xpubs/pubkeys that will be used for
      // background discovery after onboarding completes.
      const index0Mainnet = multiIndexKeys.mainnet[0]
      const index0Testnet = multiIndexKeys.testnet[0]

      Logger.info('handleComplete called', {
        hasAccount0Keys: !!index0Mainnet?.avalancheKeys,
        totalIndices: Object.keys(multiIndexKeys.mainnet).length,
        hasConnectedDeviceId: !!connectedDeviceId,
        hasSelectedDerivationPath: !!selectedDerivationPath,
        isUpdatingWallet
      })

      // Fall back to BIP44 if context was reset (e.g. after a prior import)
      const derivationPath =
        selectedDerivationPath ?? LedgerDerivationPathType.BIP44

      if (
        index0Mainnet?.avalancheKeys &&
        connectedDeviceId &&
        !isUpdatingWallet
      ) {
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
            avalancheKeys: index0Mainnet.avalancheKeys,
            solanaKeys: index0Mainnet.solanaKeys,
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
              mainnet: index0Mainnet,
              testnet: index0Testnet ?? {
                solanaKeys: [],
                avalancheKeys: undefined
              }
            }
          })

          LedgerService.stopAppPolling()
          onNavigateToComplete()

          // Trigger background discovery for accounts 1-9.
          // This runs after navigation — the user doesn't wait.
          const walletType =
            derivationPath === LedgerDerivationPathType.BIP44
              ? WalletType.LEDGER
              : WalletType.LEDGER_LIVE

          setTimeout(() => {
            dispatch(onWalletImported({ walletId, walletType }))
          }, 1500)
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
        }
      } else {
        Logger.error('Ledger wallet creation conditions not met', {
          hasAccount0Keys: !!index0Mainnet?.avalancheKeys,
          hasConnectedDeviceId: !!connectedDeviceId,
          hasSelectedDerivationPath: !!selectedDerivationPath,
          isUpdatingWallet
        })
        Alert.alert(
          'Wallet setup failed',
          'Unable to complete Ledger wallet setup. Please restart the setup process.',
          [{ text: 'OK', onPress: handleCancel }]
        )
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
      onNavigateToComplete,
      handleCancel,
      dispatch
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
  const additionalXpubs: Record<number, { evm: string; avalanche: string }> =
    {}
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
