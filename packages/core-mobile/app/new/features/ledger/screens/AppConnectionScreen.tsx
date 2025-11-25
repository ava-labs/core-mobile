import React, { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { ProgressDots } from 'common/components/ProgressDots'
import { LedgerAppConnection } from 'new/features/ledger/components/LedgerAppConnection'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import Logger from 'utils/Logger'
import LedgerService from 'services/ledger/LedgerService'

export default function AppConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const {
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    resetSetup,
    disconnectDevice,
    createLedgerWallet
  } = useLedgerSetupContext()

  const handleComplete = useCallback(
    async (keys: {
      solanaKeys: Array<{ key: string; derivationPath: string; curve: string }>
      avalancheKeys: { evm: string; avalanche: string; pvm: string } | null
      bitcoinAddress: string
      xpAddress: string
    }) => {
      Logger.info('handleComplete called', {
        hasAvalancheKeys: !!keys.avalancheKeys,
        hasConnectedDeviceId: !!connectedDeviceId,
        hasSelectedDerivationPath: !!selectedDerivationPath,
        isCreatingWallet,
        solanaKeysCount: keys.solanaKeys.length
      })

      // If wallet hasn't been created yet, create it now
      if (
        keys.avalancheKeys &&
        connectedDeviceId &&
        selectedDerivationPath &&
        !isCreatingWallet
      ) {
        Logger.info('All conditions met, creating wallet...')
        setIsCreatingWallet(true)

        try {
          await createLedgerWallet({
            deviceId: connectedDeviceId,
            deviceName: connectedDeviceName,
            derivationPathType: selectedDerivationPath,
            avalancheKeys: keys.avalancheKeys,
            solanaKeys: keys.solanaKeys
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
          setIsCreatingWallet(false)
        }
      } else {
        Logger.info(
          'Wallet creation conditions not met, skipping wallet creation',
          {
            hasAvalancheKeys: !!keys.avalancheKeys,
            hasConnectedDeviceId: !!connectedDeviceId,
            hasSelectedDerivationPath: !!selectedDerivationPath,
            isCreatingWallet
          }
        )
        // @ts-ignore TODO: make routes typesafe
        push('/accountSettings/ledger/complete')
      }
    },
    [
      connectedDeviceId,
      connectedDeviceName,
      selectedDerivationPath,
      createLedgerWallet,
      push,
      isCreatingWallet
    ]
  )

  const handleCancel = useCallback(async () => {
    await disconnectDevice()
    resetSetup()
    back()
  }, [disconnectDevice, resetSetup, back])

  // Cleanup: Stop polling when component unmounts (unless wallet creation is in progress)
  useEffect(() => {
    return () => {
      // Only stop polling if we're not in the middle of wallet creation
      // If wallet creation succeeded, the connection should remain for the wallet to use
      if (!isCreatingWallet) {
        Logger.info('AppConnectionScreen unmounting, stopping app polling')
        LedgerService.stopAppPolling()
      }
    }
  }, [isCreatingWallet])

  const renderHeaderCenterComponent = useCallback(() => {
    return <ProgressDots totalSteps={3} currentStep={currentStep} />
  }, [currentStep])

  return (
    <ScrollScreen
      renderHeaderCenterComponent={renderHeaderCenterComponent}
      showNavigationHeaderTitle={false}
      hasParent={true}
      isModal={true}
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <LedgerAppConnection
        onComplete={handleComplete}
        onCancel={handleCancel}
        deviceName={connectedDeviceName}
        selectedDerivationPath={selectedDerivationPath}
        isCreatingWallet={isCreatingWallet}
        connectedDeviceId={connectedDeviceId}
        connectedDeviceName={connectedDeviceName}
        onStepChange={setCurrentStep}
      />
    </ScrollScreen>
  )
}
