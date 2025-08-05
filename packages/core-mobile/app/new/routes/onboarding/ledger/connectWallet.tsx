import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Alert,
  FlatList,
  Platform,
  PermissionsAndroid,
  Linking
} from 'react-native'

import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { Button, Card, Text as K2Text, useTheme } from '@avalabs/k2-alpine'

interface Device {
  id: string
  name: string
  rssi?: number
}

interface TransportState {
  available: boolean
  powered: boolean
}

export default function ConnectWallet(): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  const [transportState, setTransportState] = useState<TransportState>({
    available: false,
    powered: false
  })
  const [devices, setDevices] = useState<Device[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null)

  // Monitor BLE transport state
  useEffect(() => {
    const subscription = TransportBLE.observeState({
      next: event => {
        setTransportState({
          available: event.available,
          powered: false // Remove powered property since it doesn't exist
        })
      },
      complete: () => {
        // Handle completion
      },
      error: error => {
        Alert.alert(
          'BLE Error',
          `Failed to monitor BLE state: ${error.message}`
        )
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Request Bluetooth permissions
  const requestBluetoothPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        ].filter(Boolean) as any[]

        const granted = await PermissionsAndroid.requestMultiple(permissions)

        return Object.values(granted).every(
          permission => permission === 'granted'
        )
      } catch (err) {
        return false
      }
    } else if (Platform.OS === 'ios') {
      // iOS permissions are handled automatically by the TransportBLE library
      return true
    }
    return false
  }, [])

  // Handle scan errors
  const handleScanError = useCallback((error: any) => {
    setIsScanning(false)

    // Handle specific authorization errors
    if (
      error.message?.includes('not authorized') ||
      error.message?.includes('Origin: 101')
    ) {
      Alert.alert(
        'Bluetooth Permission Required',
        'Please enable Bluetooth permissions in your device settings to scan for Ledger devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              // You can add navigation to settings here if needed
            }
          }
        ]
      )
    } else {
      Alert.alert('Scan Error', `Failed to scan for devices: ${error.message}`)
    }
  }, [])

  // Scan for Ledger devices
  const scanForDevices = useCallback(async () => {
    if (!transportState.available) {
      Alert.alert(
        'Bluetooth Unavailable',
        'Please enable Bluetooth to scan for Ledger devices'
      )
      return
    }

    // Request permissions before scanning
    const hasPermissions = await requestBluetoothPermissions()
    if (!hasPermissions) {
      Alert.alert(
        'Permission Required',
        'Bluetooth permissions are required to scan for Ledger devices. Please grant permissions in your device settings.'
      )
      return
    }

    setIsScanning(true)
    setDevices([])

    try {
      const subscription = TransportBLE.listen({
        next: event => {
          if (event.type === 'add') {
            const device: Device = {
              id: event.descriptor.id,
              name: event.descriptor.name || 'Unknown Device',
              rssi: event.descriptor.rssi
            }

            setDevices(prev => {
              // Avoid duplicates
              const exists = prev.find(d => d.id === device.id)
              if (!exists) {
                return [...prev, device]
              }
              return prev
            })
          }
        },
        complete: () => {
          setIsScanning(false)
        },
        error: handleScanError
      })

      // Stop scanning after 10 seconds
      setTimeout(() => {
        subscription.unsubscribe()
        setIsScanning(false)
      }, 10000)
    } catch (error) {
      setIsScanning(false)
      Alert.alert(
        'Scan Error',
        `Failed to start scanning: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }, [transportState.available, requestBluetoothPermissions, handleScanError])

  // Open Bluetooth settings
  const openBluetoothSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:Bluetooth')
    } else {
      Linking.openSettings()
    }
  }, [])

  // Connect to a specific device with error handling for TurboModule issue
  const connectToDevice = useCallback(
    async (device: Device) => {
      setIsConnecting(true)

      try {
        const connectionPromise = TransportBLE.open(device.id)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )

        await Promise.race([connectionPromise, timeoutPromise])

        setConnectedDevice(device)
        Alert.alert('Success', `Connected to ${device.name}`)
      } catch (error) {
        let errorMessage = 'Unknown connection error'

        if (error instanceof Error) {
          if (error.message.includes('TurboModule')) {
            errorMessage =
              'Connection failed due to compatibility issue. Please try restarting the app or updating to the latest version.'
          } else if (error.message.includes('timeout')) {
            errorMessage =
              'Connection timed out. Please make sure your Ledger device is unlocked and in pairing mode.'
          } else if (error.message.includes('PeerRemovedPairing')) {
            Alert.alert(
              'Pairing Removed',
              'The pairing with your Ledger device was removed. Would you like to open Bluetooth settings to re-pair?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: openBluetoothSettings
                }
              ]
            )
            return // Don't show the generic error alert
          } else {
            errorMessage = error.message
          }
        }

        Alert.alert(
          'Connection Error',
          `Failed to connect to ${device.name}: ${errorMessage}`
        )
      } finally {
        setIsConnecting(false)
      }
    },
    [openBluetoothSettings]
  )

  // Disconnect from current device
  const disconnectDevice = useCallback(async () => {
    try {
      // Close any open transport connections
      setConnectedDevice(null)
      Alert.alert(
        'Disconnected',
        'Successfully disconnected from Ledger device'
      )
    } catch (error) {
      Alert.alert(
        'Disconnect Error',
        `Failed to disconnect: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }, [])

  const renderDevice = ({ item }: { item: Device }) => (
    <Card sx={{ marginBottom: 12, padding: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
        <View>
          <K2Text variant="heading6" sx={{ color: colors.$textPrimary }}>
            {item.name}
          </K2Text>
          <K2Text variant="body2" sx={{ color: colors.$textSecondary }}>
            ID: {item.id}
          </K2Text>
          {item.rssi && (
            <K2Text variant="caption" sx={{ color: colors.$textSecondary }}>
              Signal: {item.rssi} dBm
            </K2Text>
          )}
        </View>
        <Button
          type="primary"
          size="medium"
          onPress={() => connectToDevice(item)}
          disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      </View>
    </Card>
  )

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.$surfacePrimary, padding: 16 }}>
      <K2Text
        variant="heading4"
        sx={{ color: colors.$textPrimary, marginBottom: 24 }}>
        Connect Ledger Device
      </K2Text>

      {/* BLE Status */}
      <Card sx={{ marginBottom: 16, padding: 16 }}>
        <K2Text
          variant="heading6"
          sx={{ color: colors.$textPrimary, marginBottom: 8 }}>
          Bluetooth Status
        </K2Text>
        <K2Text variant="body2" sx={{ color: colors.$textSecondary }}>
          Available: {transportState.available ? 'Yes' : 'No'}
        </K2Text>
        <K2Text variant="body2" sx={{ color: colors.$textSecondary }}>
          Powered: {transportState.powered ? 'Yes' : 'No'}
        </K2Text>
      </Card>

      {/* Connected Device */}
      {connectedDevice && (
        <Card
          sx={{
            marginBottom: 16,
            padding: 16,
            backgroundColor: colors.$textSuccess + '20'
          }}>
          <K2Text
            variant="heading6"
            sx={{ color: colors.$textSuccess, marginBottom: 8 }}>
            Connected Device
          </K2Text>
          <K2Text variant="body2" sx={{ color: colors.$textPrimary }}>
            {connectedDevice.name}
          </K2Text>
          <Button
            type="secondary"
            size="small"
            onPress={disconnectDevice}
            style={{ marginTop: 8 }}>
            Disconnect
          </Button>
        </Card>
      )}

      {/* Scan Button */}
      <Button
        type="primary"
        size="large"
        onPress={scanForDevices}
        disabled={!transportState.available || isScanning}
        style={{ marginBottom: 16 }}>
        {isScanning ? 'Scanning...' : 'Scan for Ledger Devices'}
      </Button>

      {/* Device List */}
      {devices.length > 0 && (
        <View style={{ flex: 1 }}>
          <K2Text
            variant="heading6"
            sx={{ color: colors.$textPrimary, marginBottom: 12 }}>
            Available Devices ({devices.length})
          </K2Text>
          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Instructions */}
      {devices.length === 0 && !isScanning && (
        <Card sx={{ padding: 16 }}>
          <K2Text
            variant="body1"
            sx={{ color: colors.$textSecondary, textAlign: 'center' }}>
            Make sure your Ledger device is:
          </K2Text>
          <K2Text
            variant="body2"
            sx={{ color: colors.$textSecondary, marginTop: 8 }}>
            • Unlocked and on the home screen
          </K2Text>
          <K2Text variant="body2" sx={{ color: colors.$textSecondary }}>
            • Has Bluetooth enabled
          </K2Text>
          <K2Text variant="body2" sx={{ color: colors.$textSecondary }}>
            • Is within range of your device
          </K2Text>
        </Card>
      )}
    </View>
  )
}
