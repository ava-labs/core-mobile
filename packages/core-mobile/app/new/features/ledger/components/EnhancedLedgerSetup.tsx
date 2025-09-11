import React, { useState, useCallback } from 'react'
import { View, Alert } from 'react-native'
import { Text, Button, useTheme } from '@avalabs/k2-alpine'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'
import { useLedgerWallet, WalletCreationOptions } from '../hooks/useLedgerWallet'
import { DerivationPathSelector } from './DerivationPathSelector'
import { DerivationPathEducation } from './DerivationPathEducation'
import { LedgerSetupProgress } from './LedgerSetupProgress'

type SetupStep = 'device-connection' | 'path-selection' | 'education' | 'setup-progress' | 'complete'

interface EnhancedLedgerSetupProps {
  onComplete: (walletId: string) => void
  onCancel?: () => void
}

export const EnhancedLedgerSetup: React.FC<EnhancedLedgerSetupProps> = ({
  onComplete,
  onCancel
}) => {
  const { theme: { colors } } = useTheme()
  const [currentStep, setCurrentStep] = useState<SetupStep>('device-connection')
  const [selectedDerivationPath, setSelectedDerivationPath] = useState<LedgerDerivationPathType | null>(null)
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null)
  const [connectedDeviceName, setConnectedDeviceName] = useState<string>('Ledger Device')

  const {
    devices,
    isScanning,
    isConnecting,
    isLoading,
    transportState,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    getSolanaKeys,
    getAvalancheKeys,
    getLedgerLiveKeys,
    createLedgerWallet,
    setupProgress,
    keys
  } = useLedgerWallet()

  // Check if keys are available and auto-progress to path selection
  React.useEffect(() => {
    if (keys.avalancheKeys && keys.solanaKeys.length > 0 && currentStep === 'device-connection') {
      // Set a device ID if not set (keys were retrieved so device must be connected)
      if (!connectedDeviceId) {
        setConnectedDeviceId('auto-detected')
        setConnectedDeviceName('Ledger Device')
        // Don't change step yet, let the next effect cycle handle it
        return
      }
      
      setCurrentStep('path-selection')
    }
  }, [keys.avalancheKeys, keys.solanaKeys, currentStep, connectedDeviceId])

  // Handle device connection
  const handleDeviceConnection = useCallback(async (deviceId: string, deviceName: string) => {
    try {
      await connectToDevice(deviceId)
      setConnectedDeviceId(deviceId)
      setConnectedDeviceName(deviceName)
      
      // Get keys for both derivation paths
      await Promise.all([
        getSolanaKeys(),
        getAvalancheKeys()
      ])
      
      setCurrentStep('path-selection')
    } catch (error) {
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Ledger device. Please try again.',
        [{ text: 'OK' }]
      )
    }
  }, [connectToDevice, getSolanaKeys, getAvalancheKeys])

  // Handle derivation path selection
  const handleDerivationPathSelect = useCallback((derivationPathType: LedgerDerivationPathType) => {
    setSelectedDerivationPath(derivationPathType)
    handleStartSetup(derivationPathType)
  }, [handleStartSetup])

  // Start wallet setup
  const handleStartSetup = useCallback(async (derivationPathType: LedgerDerivationPathType) => {
    if (!connectedDeviceId) {
      return
    }

    try {
      setCurrentStep('setup-progress')
      
      let individualKeys: any[] = []
      
      // Different key retrieval based on derivation path type
      if (derivationPathType === LedgerDerivationPathType.LedgerLive) {
        const accountCount = 3 // Default 3 accounts for Ledger Live
        const result = await getLedgerLiveKeys(accountCount, (step, progress, totalSteps) => {
          // Progress callback for UI updates
        })
        
        individualKeys = result.individualKeys
        
      } else {
        // For BIP44, we use the existing keys that were already retrieved
        // This maintains backward compatibility
      }
      
      const walletCreationOptions: WalletCreationOptions = {
        deviceId: connectedDeviceId,
        deviceName: connectedDeviceName,
        derivationPathType,
        accountCount: derivationPathType === LedgerDerivationPathType.BIP44 ? 3 : 1,
        individualKeys, // Pass the individual keys for Ledger Live
        progressCallback: (step, progress, totalSteps) => {
          // Progress callback for UI updates
        }
      }

      const walletId = await createLedgerWallet(walletCreationOptions)
      setCurrentStep('complete')
      onComplete(walletId)
    } catch (error) {
      console.error('Wallet creation failed:', error)
      Alert.alert(
        'Setup Failed',
        'Failed to create Ledger wallet. Please try again.',
        [
          { text: 'Try Again', onPress: () => setCurrentStep('path-selection') },
          { text: 'Cancel', onPress: onCancel }
        ]
      )
    }
  }, [connectedDeviceId, connectedDeviceName, createLedgerWallet, getLedgerLiveKeys, onComplete, onCancel])

  // Handle education flow
  const handleShowEducation = useCallback(() => {
    setCurrentStep('education')
  }, [])

  const handleEducationClose = useCallback(() => {
    setCurrentStep('path-selection')
  }, [])

  const handleEducationRecommended = useCallback(() => {
    setSelectedDerivationPath(LedgerDerivationPathType.BIP44)
    handleStartSetup(LedgerDerivationPathType.BIP44)
  }, [handleStartSetup])

  // Handle cancellation
  const handleCancel = useCallback(async () => {
    if (connectedDeviceId) {
      await disconnectDevice()
    }
    onCancel?.()
  }, [connectedDeviceId, disconnectDevice, onCancel])

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
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

      case 'path-selection':
        return (
          <View style={{ flex: 1 }}>
            <DerivationPathSelector
              onSelect={handleDerivationPathSelect}
              onCancel={handleCancel}
            />
            
            {/* Help button */}
            <View style={{ 
              position: 'absolute', 
              top: 24, 
              right: 24 
            }}>
              <Button
                type="tertiary"
                size="small"
                onPress={handleShowEducation}
              >
                Need Help?
              </Button>
            </View>
          </View>
        )

      case 'education':
        return (
          <DerivationPathEducation
            onClose={handleEducationClose}
            onSelectRecommended={handleEducationRecommended}
          />
        )

      case 'setup-progress':
        return setupProgress ? (
          <LedgerSetupProgress
            progress={setupProgress}
            derivationPathType={selectedDerivationPath!}
            onCancel={handleCancel}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Initializing setup...</Text>
          </View>
        )

      case 'complete':
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text variant="heading4" style={{ textAlign: 'center', marginBottom: 16 }}>
              🎉 Wallet Created Successfully!
            </Text>
            <Text variant="body1" style={{ 
              textAlign: 'center', 
              color: colors.$textSecondary,
              marginBottom: 32
            }}>
              Your Ledger wallet has been set up and is ready to use.
            </Text>
            <Button
              type="primary"
              size="large"
              onPress={() => onComplete('')}
            >
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

// Simple device connection component (placeholder - would need full implementation)
const DeviceConnectionStep: React.FC<{
  devices: any[]
  isScanning: boolean
  isConnecting: boolean
  transportState: any
  onScan: () => void
  onConnect: (deviceId: string, deviceName: string) => void
  onCancel: () => void
}> = ({ devices, isScanning, isConnecting, onScan, onConnect, onCancel }) => {
  const { theme: { colors } } = useTheme()

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
      <Text variant="heading4" style={{ textAlign: 'center', marginBottom: 16 }}>
        Connect Your Ledger
      </Text>
      <Text variant="body1" style={{ 
        textAlign: 'center', 
        color: colors.$textSecondary,
        marginBottom: 32
      }}>
        Make sure your Ledger device is unlocked and the Avalanche app is open.
      </Text>
      
      <Button
        type="primary"
        size="large"
        onPress={onScan}
        disabled={isScanning || isConnecting}
        style={{ marginBottom: 16 }}
      >
        {isScanning ? 'Scanning...' : 'Scan for Devices'}
      </Button>

      {devices.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          {devices.map((device) => (
            <Button
              key={device.id}
              type="secondary"
              size="large"
              onPress={() => onConnect(device.id, device.name)}
              disabled={isConnecting}
              style={{ marginBottom: 8 }}
            >
              {isConnecting ? 'Connecting...' : `Connect to ${device.name}`}
            </Button>
          ))}
        </View>
      )}

      <Button
        type="tertiary"
        size="large"
        onPress={onCancel}
      >
        Cancel
      </Button>
    </View>
  )
}
