import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { LedgerAppConnection } from 'new/features/ledger/components/LedgerAppConnection'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'

export default function AppConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  const {
    getSolanaKeys,
    getAvalancheKeys,
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    keys,
    resetSetup,
    disconnectDevice,
    createLedgerWallet
  } = useLedgerSetupContext()

  // Check if keys are available and create wallet, then navigate to complete
  useEffect(() => {
    const createWalletAndNavigate = async () => {
      if (
        keys.avalancheKeys &&
        keys.solanaKeys.length > 0 &&
        connectedDeviceId &&
        selectedDerivationPath &&
        !isCreatingWallet
      ) {
        setIsCreatingWallet(true)

        try {
          await createLedgerWallet({
            deviceId: connectedDeviceId,
            deviceName: connectedDeviceName,
            derivationPathType: selectedDerivationPath
          })

          // Navigate to complete screen after wallet creation
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
      }
    }

    createWalletAndNavigate()
  }, [
    keys.avalancheKeys,
    keys.solanaKeys,
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    createLedgerWallet,
    push,
    isCreatingWallet
  ])

  const handleComplete = useCallback(async () => {
    // If wallet hasn't been created yet, create it now
    if (
      keys.avalancheKeys &&
      keys.solanaKeys.length > 0 &&
      connectedDeviceId &&
      selectedDerivationPath &&
      !isCreatingWallet
    ) {
      setIsCreatingWallet(true)

      try {
        await createLedgerWallet({
          deviceId: connectedDeviceId,
          deviceName: connectedDeviceName,
          derivationPathType: selectedDerivationPath
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
  }, [
    keys.avalancheKeys,
    keys.solanaKeys,
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    createLedgerWallet,
    push,
    isCreatingWallet
  ])

  const handleCancel = useCallback(async () => {
    await disconnectDevice()
    resetSetup()
    back()
  }, [disconnectDevice, resetSetup, back])

  return (
    <LedgerAppConnection
      onComplete={handleComplete}
      onCancel={handleCancel}
      getSolanaKeys={getSolanaKeys}
      getAvalancheKeys={getAvalancheKeys}
      deviceName={connectedDeviceName}
      selectedDerivationPath={selectedDerivationPath}
      isCreatingWallet={isCreatingWallet}
    />
  )
}
