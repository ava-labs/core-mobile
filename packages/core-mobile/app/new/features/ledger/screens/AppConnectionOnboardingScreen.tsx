import React, { useCallback } from 'react'
import Logger from 'utils/Logger'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { Alert } from 'react-native'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerKeysByNetwork } from 'services/ledger/types'
import { useRouter } from 'expo-router'
import { useLedgerWallet } from '../hooks/useLedgerWallet'
import { useLedgerSetupContext } from '../contexts/LedgerSetupContext'
import { useSetLedgerAddress } from '../hooks/useSetLedgerAddress'
import AppConnectionScreen from './AppConnectionScreen'

export const AppConnectionOnboardingScreen = (): JSX.Element => {
  const { createLedgerWallet } = useLedgerWallet()
  const { push } = useRouter()
  const { setLedgerAddress } = useSetLedgerAddress()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const {
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    disconnectDevice,
    isUpdatingWallet,
    setIsUpdatingWallet
  } = useLedgerSetupContext()

  const handleComplete = useCallback(
    async (keys: LedgerKeysByNetwork) => {
      const keysByNetwork = isDeveloperMode ? keys.testnet : keys.mainnet
      Logger.info('handleComplete called', {
        hasAvalancheKeys: !!keysByNetwork.avalancheKeys,
        hasConnectedDeviceId: !!connectedDeviceId,
        hasSelectedDerivationPath: !!selectedDerivationPath,
        isUpdatingWallet,
        solanaKeysCount: keysByNetwork.solanaKeys?.length ?? 0
      })

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
          // @ts-ignore TODO: make routes typesafe
          push('/accountSettings/ledger/complete')
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
        Logger.error(
          'Wallet creation conditions not met, skipping wallet creation',
          {
            hasAvalancheKeys: !!keysByNetwork.avalancheKeys,
            hasConnectedDeviceId: !!connectedDeviceId,
            hasSelectedDerivationPath: !!selectedDerivationPath,
            isUpdatingWallet
          }
        )
        // @ts-ignore TODO: make routes typesafe
        push('/accountSettings/ledger/complete')
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
      push
    ]
  )

  return (
    <AppConnectionScreen
      completeStepTitle={`Your Ledger wallet\nis being set up`}
      handleComplete={handleComplete}
      deviceId={connectedDeviceId}
      deviceName={connectedDeviceName}
      isUpdatingWallet={isUpdatingWallet}
      disconnectDevice={disconnectDevice}
      accountIndex={0} // intentionally setting it to zero here as this screen is used for importing the wallet for the first time
    />
  )
}
