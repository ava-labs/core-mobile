import React, { useCallback, useState, useEffect } from 'react'
import {
  View,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid
} from 'react-native'
import { useRouter } from 'expo-router'
import { Button, useTheme, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { AnimatedIconWithText } from 'new/features/ledger/components/AnimatedIconWithText'
import { LedgerDeviceList } from 'new/features/ledger/components/LedgerDeviceList'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerDevice } from 'services/ledger/types'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'

export default function DeviceConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const { isConnecting, connectToDevice, setConnectedDevice, resetSetup } =
    useLedgerSetupContext()

  // Local device management
  const [devices, setDevices] = useState<LedgerDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [transportState, setTransportState] = useState({ available: false })

  // Monitor BLE transport state
  useEffect(() => {
    const subscription = TransportBLE.observeState({
      next: (event: { available: boolean }) => {
        setTransportState({ available: event.available })
      },
      error: (error: Error) => {
        Alert.alert(
          'BLE Error',
          `Failed to monitor BLE state: ${error.message}`
        )
      },
      complete: () => {
        // BLE scan complete
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  // Request Bluetooth permissions
  const requestBluetoothPermissions =
    useCallback(async (): Promise<boolean> => {
      if (Platform.OS !== 'android') {
        return true
      }

      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ])

        return Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        )
      } catch (error) {
        return false
      }
    }, [])

  // Scan for devices
  const scanForDevices = useCallback(async () => {
    if (!transportState.available) {
      Alert.alert(
        'Bluetooth Unavailable',
        'Please enable Bluetooth to scan for Ledger devices'
      )
      return
    }

    const hasPermissions = await requestBluetoothPermissions()
    if (!hasPermissions) {
      Alert.alert(
        'Permission Required',
        'Bluetooth permissions are required to scan for Ledger devices.'
      )
      return
    }

    try {
      await LedgerService.startDeviceScanning()
    } catch (error) {
      Alert.alert(
        'Scan Error',
        `Failed to scan for devices: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }, [transportState.available, requestBluetoothPermissions])

  // Handle device connection
  const handleDeviceConnection = useCallback(
    async (deviceId: string, deviceName: string) => {
      try {
        await connectToDevice(deviceId)
        setConnectedDevice(deviceId, deviceName)

        // Navigate to app connection step
        // @ts-ignore TODO: make routes typesafe
        push('/accountSettings/ledger/appConnection')
      } catch (error) {
        Alert.alert(
          'Connection failed',
          'Failed to connect to Ledger device. Please try again.',
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
    [connectToDevice, setConnectedDevice, push, resetSetup]
  )

  const handleCancel = useCallback(() => {
    resetSetup()
    back()
  }, [resetSetup, back])

  const renderFooter = useCallback(() => {
    return (
      <View style={{ gap: 12 }}>
        {!isScanning && devices.length === 0 && (
          <Button type="primary" size="large" onPress={scanForDevices}>
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
    handleCancel
  ])

  return (
    <ScrollScreen
      title={`Connect \nYour Ledger`}
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
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
