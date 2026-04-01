import React, { useCallback } from 'react'
import Logger from 'utils/Logger'
import { Alert } from 'react-native'
import LedgerService from 'services/ledger/LedgerService'
import {
  LedgerDerivationPathType,
  LedgerMultiIndexKeys
} from 'services/ledger/types'
import { useRouter } from 'expo-router'
import { useLedgerWallet } from '../hooks/useLedgerWallet'
import { useLedgerSetupContext } from '../contexts/LedgerSetupContext'
import { useSetLedgerAddress } from '../hooks/useSetLedgerAddress'
import {
  getActiveAccountIndices,
  LedgerDerivedAccount
} from '../utils/discoverLedgerAccounts'
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
  const { createLedgerWalletWithDiscovery } = useLedgerWallet()
  const { setLedgerAddressesForMultipleAccounts } = useSetLedgerAddress()
  const { canGoBack, back } = useRouter()

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
      const hasAnyKeys = Object.values(multiIndexKeys.mainnet).some(
        keys => keys.avalancheKeys !== undefined
      )

      Logger.info('handleComplete called', {
        hasAnyKeys,
        mainnetIndexCount: Object.keys(multiIndexKeys.mainnet).length,
        hasConnectedDeviceId: !!connectedDeviceId,
        hasSelectedDerivationPath: !!selectedDerivationPath,
        isUpdatingWallet
      })

      // If wallet hasn't been created yet, create it now
      if (
        hasAnyKeys &&
        connectedDeviceId &&
        selectedDerivationPath &&
        !isUpdatingWallet
      ) {
        Logger.info('All conditions met, creating wallet with discovery...')
        setIsUpdatingWallet(true)

        try {
          // Convert multi-index keys to LedgerDerivedAccount[] for activity check
          const derivedAccounts: LedgerDerivedAccount[] = Object.entries(
            multiIndexKeys.mainnet
          )
            .filter(([_, keys]) => keys.avalancheKeys !== undefined)
            .map(([indexStr, keys]) => ({
              index: Number(indexStr),
              addressC: keys.avalancheKeys!.addresses.evm,
              addressBTC: keys.avalancheKeys!.addresses.btc,
              xpubXP: keys.avalancheKeys!.xpubs.avalanche,
              addressSVM: keys.solanaKeys?.[0]?.key
            }))

          // Determine which account indices have on-chain activity
          const activeIndices = await getActiveAccountIndices(derivedAccounts)
          Logger.info('Active account indices discovered', { activeIndices })

          // Create wallet with all active accounts
          const { walletId, createdAccounts } =
            await createLedgerWalletWithDiscovery({
              deviceId: connectedDeviceId,
              deviceName: connectedDeviceName,
              derivationPathType: selectedDerivationPath,
              multiIndexKeys,
              activeIndices
            })

          // Store ledger addresses for all created accounts
          await setLedgerAddressesForMultipleAccounts(
            createdAccounts.map(({ accountId, accountIndex }) => ({
              walletId,
              accountId,
              accountIndex,
              mainnetKeys: multiIndexKeys.mainnet[accountIndex],
              testnetKeys: multiIndexKeys.testnet[accountIndex]
            }))
          )

          Logger.info(
            'Wallet created successfully with discovered accounts, navigating to complete screen',
            { accountCount: createdAccounts.length }
          )
          // Stop polling since we no longer need app detection
          LedgerService.stopAppPolling()
          onNavigateToComplete()
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
        const errorMsg = 'Ledger wallet creation conditions not met'
        Logger.error(errorMsg, {
          hasAnyKeys,
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
      createLedgerWalletWithDiscovery,
      connectedDeviceName,
      setLedgerAddressesForMultipleAccounts,
      onNavigateToComplete,
      handleCancel
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
      accountIndex={0} // intentionally setting it to zero here as this screen is used for importing the wallet for the first time
      showProgressDots={false}
      showConnectionToasts={showConnectionToasts}
      showCancelOnComplete={showCancelOnComplete}
    />
  )
}
