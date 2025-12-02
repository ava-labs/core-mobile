import React, { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { ProgressDots } from 'common/components/ProgressDots'
import { LedgerAppConnection } from 'new/features/ledger/components/LedgerAppConnection'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'

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
      // If wallet hasn't been created yet, create it now
      if (
        keys.avalancheKeys &&
        connectedDeviceId &&
        selectedDerivationPath &&
        !isCreatingWallet
      ) {
        setIsCreatingWallet(true)

        try {
          await createLedgerWallet({
            deviceId: connectedDeviceId,
            deviceName: connectedDeviceName,
            derivationPathType: selectedDerivationPath,
            avalancheKeys: keys.avalancheKeys,
            solanaKeys: keys.solanaKeys
          })

          // @ts-ignore TODO: make routes typesafe
          push('/accountSettings/ledger/complete')
        } catch (error) {
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
