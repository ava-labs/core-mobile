import React, { useCallback, useEffect } from 'react'
import { View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, useTheme } from '@avalabs/k2-alpine'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'
import { LedgerSetupProgress } from 'new/features/ledger/components/LedgerSetupProgress'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { WalletCreationOptions } from 'new/features/ledger/hooks/useLedgerWallet'

export default function SetupProgressScreen(): JSX.Element {
  const { push, back } = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const {
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    isCreatingWallet,
    hasStartedSetup,
    setIsCreatingWallet,
    setHasStartedSetup,
    createLedgerWallet,
    setupProgress,
    resetSetup,
    disconnectDevice
  } = useLedgerSetupContext()

  // Start wallet setup when entering this screen
  const handleStartSetup = useCallback(async () => {
    if (!connectedDeviceId || !selectedDerivationPath || isCreatingWallet) {
      return
    }

    try {
      setIsCreatingWallet(true)

      const walletCreationOptions: WalletCreationOptions = {
        deviceId: connectedDeviceId,
        deviceName: connectedDeviceName,
        derivationPathType: selectedDerivationPath,
        accountCount: 3, // Standard 3 accounts for both BIP44 and Ledger Live
        progressCallback: (_step, _progress, _totalSteps) => {
          // Progress callback for UI updates
        }
      }

      await createLedgerWallet(walletCreationOptions)

      // Navigate to completion screen
      // @ts-ignore TODO: make routes typesafe
      push('/accountSettings/ledger/complete')
    } catch (error) {
      // Wallet creation failed
      Alert.alert(
        'Setup Failed',
        'Failed to create Ledger wallet. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setIsCreatingWallet(false)
              // @ts-ignore TODO: make routes typesafe
              back() // Go back to app connection
            }
          },
          {
            text: 'Cancel',
            onPress: async () => {
              setIsCreatingWallet(false)
              await disconnectDevice()
              resetSetup()
              // Navigate back to import wallet screen
              // @ts-ignore TODO: make routes typesafe
              push('/accountSettings/importWallet')
            }
          }
        ]
      )
    } finally {
      setIsCreatingWallet(false)
    }
  }, [
    connectedDeviceId,
    connectedDeviceName,
    selectedDerivationPath,
    isCreatingWallet,
    setIsCreatingWallet,
    createLedgerWallet,
    push,
    back,
    disconnectDevice,
    resetSetup
  ])

  // Auto-start wallet creation when entering this screen
  useEffect(() => {
    if (
      selectedDerivationPath &&
      connectedDeviceId &&
      !isCreatingWallet &&
      !hasStartedSetup
    ) {
      console.log('Starting wallet setup...')
      setHasStartedSetup(true)
      handleStartSetup()
    }
  }, [selectedDerivationPath, connectedDeviceId, isCreatingWallet, hasStartedSetup, setHasStartedSetup, handleStartSetup])

  const handleCancel = useCallback(async () => {
    await disconnectDevice()
    resetSetup()
    // @ts-ignore TODO: make routes typesafe
    push('/accountSettings/importWallet')
  }, [disconnectDevice, resetSetup, push])

  if (!setupProgress) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.$surfacePrimary
        }}>
        <Text>Initializing setup...</Text>
      </View>
    )
  }

  return (
    <LedgerSetupProgress
      progress={setupProgress}
      derivationPathType={
        selectedDerivationPath || LedgerDerivationPathType.BIP44
      }
      onCancel={handleCancel}
    />
  )
}
