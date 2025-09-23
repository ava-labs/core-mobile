import React, { useState, useCallback, useEffect } from 'react'
import { View, Alert } from 'react-native'
import { Text, Button, useTheme, GroupList, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LoadingState } from 'common/components/LoadingState'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'
import {
  useLedgerWallet,
  WalletCreationOptions
} from '../hooks/useLedgerWallet'
import { DerivationPathSelector } from './DerivationPathSelector'
import { LedgerSetupProgress } from './LedgerSetupProgress'
import { LedgerAppConnection } from './LedgerAppConnection'

type SetupStep =
  | 'path-selection'
  | 'education'
  | 'device-connection'
  | 'app-connection'
  | 'setup-progress'
  | 'complete'

interface EnhancedLedgerSetupProps {
  onComplete: (walletId: string) => void
  onCancel?: () => void
}

export const EnhancedLedgerSetup: React.FC<EnhancedLedgerSetupProps> = ({
  onComplete,
  onCancel
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const [currentStep, setCurrentStep] = useState<SetupStep>('path-selection')
  const [selectedDerivationPath, setSelectedDerivationPath] =
    useState<LedgerDerivationPathType | null>(null)
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(
    null
  )
  const [connectedDeviceName, setConnectedDeviceName] =
    useState<string>('Ledger Device')
  const [isCreatingWallet, setIsCreatingWallet] = useState<boolean>(false)

  const {
    devices,
    isScanning,
    isConnecting,
    transportState,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    getSolanaKeys,
    getAvalancheKeys,
    createLedgerWallet,
    setupProgress,
    keys
  } = useLedgerWallet()

  // Check if keys are available and auto-progress to setup
  useEffect(() => {
    if (
      keys.avalancheKeys &&
      keys.solanaKeys.length > 0 &&
      currentStep === 'app-connection'
    ) {
      setCurrentStep('setup-progress')
    }
  }, [keys.avalancheKeys, keys.solanaKeys, currentStep])

  // Handle device connection
  const handleDeviceConnection = useCallback(
    async (deviceId: string, deviceName: string) => {
      try {
        await connectToDevice(deviceId)
        setConnectedDeviceId(deviceId)
        setConnectedDeviceName(deviceName)

        // Move to app connection step instead of getting keys immediately
        setCurrentStep('app-connection')
      } catch (error) {
        Alert.alert(
          'Connection Failed',
          'Failed to connect to Ledger device. Please try again.',
          [{ text: 'OK' }]
        )
      }
    },
    [connectToDevice]
  )

  // Start wallet setup (called from setup-progress step)
  const handleStartSetup = useCallback(async () => {
    if (!connectedDeviceId || !selectedDerivationPath || isCreatingWallet) {
      return
    }

    try {
      setIsCreatingWallet(true)
      // We already have all the keys we need from the app connection step
      // No need to retrieve keys again - just create the wallet with what we have
      const walletCreationOptions: WalletCreationOptions = {
        deviceId: connectedDeviceId,
        deviceName: connectedDeviceName,
        derivationPathType: selectedDerivationPath,
        accountCount: 3, // Standard 3 accounts for both BIP44 and Ledger Live
        // Don't pass individualKeys - let the wallet creation use the keys already stored
        progressCallback: (_step, _progress, _totalSteps) => {
          // Progress callback for UI updates
        }
      }

      const walletId = await createLedgerWallet(walletCreationOptions)
      setCurrentStep('complete')
      onComplete(walletId)
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
              setCurrentStep('app-connection')
            }
          },
          {
            text: 'Cancel',
            onPress: () => {
              setIsCreatingWallet(false)
              onCancel?.()
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
    createLedgerWallet,
    onComplete,
    onCancel
  ])

  // Auto-start wallet creation when entering setup-progress step
  useEffect(() => {
    if (
      currentStep === 'setup-progress' &&
      selectedDerivationPath &&
      connectedDeviceId &&
      !isCreatingWallet
    ) {
      handleStartSetup()
    }
  }, [
    currentStep,
    selectedDerivationPath,
    connectedDeviceId,
    isCreatingWallet,
    handleStartSetup
  ])

  const handleDerivationPathSelect = useCallback(
    (derivationPathType: LedgerDerivationPathType) => {
      setSelectedDerivationPath(derivationPathType)
      setCurrentStep('device-connection')
    },
    []
  )

  const handleCancel = useCallback(async () => {
    if (connectedDeviceId) {
      await disconnectDevice()
    }
    onCancel?.()
  }, [connectedDeviceId, disconnectDevice, onCancel])

  const renderCurrentStep = (): React.ReactNode => {
    switch (currentStep) {
      case 'path-selection':
        return (
          <View style={{ flex: 1 }}>
            <DerivationPathSelector
              onSelect={handleDerivationPathSelect}
              onCancel={handleCancel}
            />
          </View>
        )

      case 'device-connection':
        return (
          <DeviceConnectionStep
            devices={devices}
            isScanning={isScanning}
            isConnecting={isConnecting}
            transportState={transportState}
            onScan={scanForDevices}
            onConnect={handleDeviceConnection}
            onCancel={handleCancel}
          />
        )

      case 'app-connection':
        return (
          <LedgerAppConnection
            onComplete={() => setCurrentStep('setup-progress')}
            onCancel={handleCancel}
            getSolanaKeys={getSolanaKeys}
            getAvalancheKeys={getAvalancheKeys}
            deviceName={connectedDeviceName}
            selectedDerivationPath={selectedDerivationPath}
          />
        )

      case 'setup-progress':
        return setupProgress ? (
          <LedgerSetupProgress
            progress={setupProgress}
            derivationPathType={
              selectedDerivationPath || LedgerDerivationPathType.BIP44
            }
            onCancel={handleCancel}
          />
        ) : (
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Initializing setup...</Text>
          </View>
        )

      case 'complete':
        return (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24
            }}>
            <Text
              variant="heading4"
              style={{ textAlign: 'center', marginBottom: 16 }}>
              🎉 Wallet Created Successfully!
            </Text>
            <Text
              variant="body1"
              style={{
                textAlign: 'center',
                color: colors.$textSecondary,
                marginBottom: 32
              }}>
              Your Ledger wallet has been set up and is ready to use.
            </Text>
            <Button type="primary" size="large" onPress={() => onComplete('')}>
              Continue to Wallet
            </Button>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.$surfacePrimary }}>
      {renderCurrentStep()}
    </View>
  )
}

interface LedgerDevice {
  id: string
  name: string
}

// Enhanced device connection component
const DeviceConnectionStep: React.FC<{
  devices: LedgerDevice[]
  isScanning: boolean
  isConnecting: boolean
  transportState: unknown
  onScan: () => void
  onConnect: (deviceId: string, deviceName: string) => void
  onCancel: () => void
}> = ({ devices, isScanning, isConnecting, onScan, onConnect, onCancel }) => {
  const {
    theme: { colors }
  } = useTheme()

  const renderFooter = useCallback(() => {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Button
          type="primary"
          size="large"
          onPress={onScan}
          disabled={isScanning || isConnecting}>
          {isScanning ? 'Scanning for devices...' : 'Scan for Devices'}
        </Button>

        <Button type="tertiary" size="large" onPress={onCancel}>
          Cancel
        </Button>
      </View>
    )
  }, [isScanning, isConnecting, onScan, onCancel])

  const deviceListData = devices.map(device => ({
    title: device.name || 'Ledger Device',
    subtitle: (
      <Text variant="caption" sx={{ fontSize: 12, paddingTop: 4 }}>
        {device.id ? `ID: ${device.id.slice(0, 8)}...` : 'Ready to connect'}
      </Text>
    ),
    leftIcon: (
      <Icons.Device.Encrypted
        color={colors.$textPrimary}
        width={24}
        height={24}
      />
    ),
    accessory: (
      <Button
        type="secondary"
        size="small"
        onPress={() => onConnect(device.id, device.name)}
        disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    ),
    onPress: () => onConnect(device.id, device.name)
  }))

  return (
    <ScrollScreen
      title="Connect Your Ledger"
      subtitle="Make sure your Ledger device is unlocked and the Avalanche app is open."
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      {isScanning && (
        <View style={{ marginTop: 24 }}>
          <LoadingState sx={{ marginBottom: 16 }} />
          <Text
            variant="body2"
            style={{
              textAlign: 'center',
              color: colors.$textSecondary
            }}>
            Searching for Ledger devices...
          </Text>
        </View>
      )}

      {!isScanning && devices.length === 0 && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 48
          }}>
          <Icons.Device.Encrypted
            color={colors.$textSecondary}
            width={48}
            height={48}
          />
          <Text
            variant="body1"
            style={{
              textAlign: 'center',
              color: colors.$textSecondary,
              marginTop: 16,
              maxWidth: 280
            }}>
            No devices found. Make sure your Ledger is connected and unlocked.
          </Text>
        </View>
      )}

      {devices.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text variant="heading6" style={{ marginBottom: 16 }}>
            Available Devices
          </Text>
          <GroupList itemHeight={70} data={deviceListData} />
        </View>
      )}
    </ScrollScreen>
  )
}
