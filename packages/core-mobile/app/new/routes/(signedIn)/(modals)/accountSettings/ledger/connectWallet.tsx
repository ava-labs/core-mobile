import React from 'react'
import { View, Alert, FlatList, Linking, Platform } from 'react-native'
import { Button, Card, Text as K2Text, useTheme } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { ScrollScreen } from 'common/components/ScrollScreen'
import {
  useLedgerWallet,
  LedgerDevice
} from 'new/features/ledger/hooks/useLedgerWallet'

export default function ConnectWallet(): JSX.Element {
  const router = useRouter()
  const {
    theme: { colors }
  } = useTheme()
  const {
    devices,
    isScanning,
    isConnecting,
    transportState,
    scanForDevices,
    connectToDevice
  } = useLedgerWallet()

  // Handle successful connection
  const handleDeviceConnection = async (
    deviceId: string,
    deviceName: string
  ): Promise<void> => {
    Alert.alert('Success', `Connected to ${deviceName}`, [
      {
        text: 'Continue',
        onPress: () => {
          router.push({
            pathname: '/accountSettings/ledger/confirmAddresses',
            params: { deviceId, deviceName }
          })
        }
      }
    ])
  }

  // Open Bluetooth settings
  const openBluetoothSettings = (): void => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:Bluetooth')
    } else {
      Linking.openSettings()
    }
  }

  const renderDevice = ({ item }: { item: LedgerDevice }): JSX.Element => (
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
          onPress={async () => {
            try {
              await connectToDevice(item.id)
              handleDeviceConnection(item.id, item.name)
            } catch (error) {
              if (error instanceof Error) {
                if (error.message.includes('PeerRemovedPairing')) {
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
                } else {
                  Alert.alert(
                    'Connection Error',
                    `Failed to connect to ${item.name}: ${error.message}`
                  )
                }
              }
            }
          }}
          disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      </View>
    </Card>
  )

  return (
    <ScrollScreen
      title="Connect Ledger Device"
      isModal
      contentContainerStyle={{ padding: 16, flex: 1 }}>
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
    </ScrollScreen>
  )
}
