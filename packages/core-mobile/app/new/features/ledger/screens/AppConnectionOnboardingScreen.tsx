import React, { useCallback } from 'react'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { Alert } from 'react-native'
import LedgerService from 'services/ledger/LedgerService'
import {
  LedgerDerivationPathType,
  LedgerKeysByNetwork
} from 'services/ledger/types'
import { useRouter } from 'expo-router'
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
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
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
    async (keys: LedgerKeysByNetwork) => {
      const keysByNetwork = isDeveloperMode ? keys.testnet : keys.mainnet

      // If wallet hasn't been created yet, create it now
      if (
        keysByNetwork.avalancheKeys &&
        connectedDeviceId &&
        selectedDerivationPath &&
        !isUpdatingWallet
      ) {
        Logger.info('All conditions met, creating wallet...')
        setIsUpdatingWallet(true)

        try {
          const { walletId, accountId } = await createLedgerWallet({
            deviceId: connectedDeviceId,
            deviceName: connectedDeviceName,
            derivationPathType: selectedDerivationPath,
            avalancheKeys: keysByNetwork.avalancheKeys,
            solanaKeys: keysByNetwork.solanaKeys
          })

          await setLedgerAddress({
            accountIndex: 0,
            walletId,
            accountId,
            keys
          })

          Logger.info(
            'Wallet created successfully, navigating to complete screen'
          )
          // Stop polling since we no longer need app detection
          LedgerService.stopAppPolling()
          onNavigateToComplete()
        } catch (error) {
          Logger.error('Wallet creation failed', error)
          Alert.alert(
            'Wallet Creation Failed',
            error instanceof Error
              ? error.message
              : 'Failed to create Ledger wallet. Please try again.',
            [{ text: 'OK' }]
          )
        } finally {
          setIsUpdatingWallet(false)
        }
      } else {
        const errorMsg = 'Ledger wallet creation conditions not met'
        Logger.error(errorMsg, {
          hasAvalancheKeys: !!keysByNetwork.avalancheKeys,
          hasConnectedDeviceId: !!connectedDeviceId,
          hasSelectedDerivationPath: !!selectedDerivationPath,
          isUpdatingWallet
        })
        Alert.alert(
          'Wallet Setup Failed',
          'Unable to complete ledger wallet setup. Please restart the setup process.',
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
      isDeveloperMode,
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
