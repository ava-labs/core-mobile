import React, { useCallback, useState, useEffect } from 'react'
import { View, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Button, useTheme, Icons, Text } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { AnimatedIconWithText } from 'new/features/ledger/components/AnimatedIconWithText'
import { LedgerDeviceList } from 'new/features/ledger/components/LedgerDeviceList'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerDevice, LedgerDerivationPathType } from 'services/ledger/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useSelector } from 'react-redux'
import { selectWalletState } from 'store/app'
import { WalletState } from 'store/app/types'
import { useBluetooth } from 'common/hooks/useBluetooth'
import {
  isLedgerBluetoothError,
  isLedgerConnectionFailed,
  showBluetoothErrorAlert,
  LEDGER_CONNECTION_FAILED_TITLE,
  LEDGER_CONNECTION_FAILED_ALREADY_CONNECTED_MESSAGE
} from 'services/ledger/LedgerBluetoothError'
import { useCheckIfLedgerWalletExists } from '../hooks/useCheckIfLedgerWalletExists'

interface DeviceConnectionScreenProps {
  onNavigateToAppConnection: () => void
}

export default function DeviceConnectionScreen({
  onNavigateToAppConnection
}: DeviceConnectionScreenProps): JSX.Element {
  const { back } = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const walletState = useSelector(selectWalletState)
  const checkIfLedgerWalletExists = useCheckIfLedgerWalletExists()
  const { isConnecting, connectToDevice, resetSetup, selectedDerivationPath } =
    useLedgerSetupContext()

  // Local device management
  const [devices, setDevices] = useState<LedgerDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const {
    isBluetoothOnAndPermissionGranted,
    isInitializingBluetooth,
    isBluetoothAvailable,
    openSettings
  } = useBluetooth()

  // Set up device listener for LedgerService
  useEffect(() => {
    const deviceListener = (newDevices: LedgerDevice[]): void => {
      setDevices(newDevices)
    }

    const syncScanningState = (): void => {
      setIsScanning(LedgerService.getIsScanning())
    }

    LedgerService.addDeviceListener(deviceListener)

    // Sync scanning state periodically
    const scanStateInterval = setInterval(syncScanningState, 1000)
    syncScanningState() // Initial sync

    return () => {
      LedgerService.removeDeviceListener(deviceListener)
      clearInterval(scanStateInterval)
      LedgerService.stopDeviceScanning() // Clean up scanning when screen unmounts
    }
  }, [])

  const handleCancel = useCallback(() => {
    resetSetup()
    back()
  }, [resetSetup, back])

  const onScanError = useCallback(
    ({ title, message }: { title: string; message: string }): void => {
      Alert.alert(title, message, [{ text: 'OK', onPress: resetSetup }])
    },
    [resetSetup]
  )

  // Scan for devices
  const scanForDevices = useCallback(async () => {
    try {
      await LedgerService.startDeviceScanning(onScanError)
    } catch (error) {
      if (isLedgerBluetoothError(error)) {
        showBluetoothErrorAlert(error)
        return
      }
      Alert.alert(
        'Scan Error',
        `Failed to scan for devices: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        [{ text: 'OK', onPress: resetSetup }]
      )
    }
  }, [resetSetup, onScanError])

  // Handle device connection
  const handleDeviceConnection = useCallback(
    async (deviceId: string, deviceName: string) => {
      const derivationPath =
        selectedDerivationPath ?? LedgerDerivationPathType.BIP44

      if (checkIfLedgerWalletExists(deviceId, derivationPath)) {
        Alert.alert(
          'Wallet already exists',
          'This Ledger wallet has already been imported.',
          [{ text: 'OK' }]
        )
        return
      }

      try {
        await connectToDevice(deviceId, deviceName)
        if (walletState === WalletState.NONEXISTENT) {
          AnalyticsService.capture('OnboardingLedgerConnected')
        } else {
          AnalyticsService.capture('WalletImportLedgerConnected')
        }
        onNavigateToAppConnection()
      } catch (error) {
        if (walletState === WalletState.NONEXISTENT) {
          AnalyticsService.capture('OnboardingLedgerConnectionFailed')
        } else {
          AnalyticsService.capture('WalletImportLedgerConnectionFailed')
        }
        Alert.alert(
          LEDGER_CONNECTION_FAILED_TITLE,
          isLedgerConnectionFailed(error)
            ? LEDGER_CONNECTION_FAILED_ALREADY_CONNECTED_MESSAGE
            : 'Failed to connect to Ledger device. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => {
                setDevices([])
                resetSetup()
              }
            }
          ]
        )
      }
    },
    [
      selectedDerivationPath,
      checkIfLedgerWalletExists,
      connectToDevice,
      resetSetup,
      onNavigateToAppConnection,
      walletState
    ]
  )

  const renderBluetoothPermissionError = useCallback(() => {
    if (isBluetoothOnAndPermissionGranted || isInitializingBluetooth)
      return null
    return (
      <View style={{ gap: 12, marginTop: 4, paddingRight: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icons.Alert.ErrorOutline
            color={colors.$textDanger}
            width={20}
            height={20}
          />
          <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
            To connect you need to allow Bluetooth in your device settings
          </Text>
        </View>
        <Button
          size="small"
          type="secondary"
          onPress={openSettings}
          style={{ width: 165, marginLeft: 28 }}>
          Open device settings
        </Button>
      </View>
    )
  }, [
    isBluetoothOnAndPermissionGranted,
    isInitializingBluetooth,
    colors,
    openSettings
  ])

  const renderFooter = useCallback(() => {
    return (
      <View style={{ gap: 12 }}>
        {!isScanning && devices.length === 0 && (
          <Button
            type="primary"
            size="large"
            onPress={scanForDevices}
            disabled={!isBluetoothAvailable || isInitializingBluetooth}>
            Scan for Device
          </Button>
        )}

        {isScanning && devices.length === 0 && (
          <View
            style={{
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 12
            }}>
            <ActivityIndicator size="large" color={colors.$textPrimary} />
          </View>
        )}

        <Button type="tertiary" size="large" onPress={handleCancel}>
          Cancel
        </Button>
      </View>
    )
  }, [
    isScanning,
    scanForDevices,
    devices.length,
    colors.$textPrimary,
    handleCancel,
    isBluetoothAvailable,
    isInitializingBluetooth
  ])

  return (
    <ScrollScreen
      title={`Connect \nYour Ledger`}
      isModal
      renderHeader={renderBluetoothPermissionError}
      renderFooter={renderFooter}
      contentContainerStyle={{ flex: 1, marginHorizontal: 16 }}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 16,
            zIndex: 1,
            pointerEvents: 'none'
          }}>
          <AnimatedIconWithText
            icon={
              <Icons.Custom.Ledger
                color={colors.$textPrimary}
                width={44}
                height={44}
              />
            }
            title={
              isScanning ? 'Looking for devices...' : 'Get your Ledger ready'
            }
            subtitle="Make sure your Ledger device is unlocked and the Avalanche app is open"
            subtitleStyle={{ fontSize: 12 }}
            showAnimation={isScanning}
          />
        </View>

        {/* Device list appears when devices are found */}
        {devices.length > 0 && (
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <LedgerDeviceList
              devices={devices}
              onDevicePress={handleDeviceConnection}
              isConnecting={isConnecting}
            />
          </View>
        )}
      </View>
    </ScrollScreen>
  )
}
