import React, { useCallback } from 'react'
import { View, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, Button, useTheme, GroupList, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { ScanningAnimation } from 'new/features/ledger/components/ScanningAnimation'

interface LedgerDevice {
  id: string
  name: string
}

export default function DeviceConnectionScreen(): JSX.Element {
  const { push, back } = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const {
    devices,
    isScanning,
    isConnecting,
    scanForDevices,
    connectToDevice,
    setConnectedDevice,
    resetSetup
  } = useLedgerSetupContext()

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
          'Connection Failed',
          'Failed to connect to Ledger device. Please try again.',
          [{ text: 'OK' }]
        )
      }
    },
    [connectToDevice, setConnectedDevice, push]
  )

  const handleCancel = useCallback(() => {
    resetSetup()
    back()
  }, [resetSetup, back])

  const renderFooter = useCallback(() => {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Button
          type="primary"
          size="large"
          onPress={scanForDevices}
          disabled={isScanning || isConnecting}>
          {isScanning ? 'Scanning for devices...' : 'Scan for Devices'}
        </Button>

        <Button type="tertiary" size="large" onPress={handleCancel}>
          Cancel
        </Button>
      </View>
    )
  }, [isScanning, isConnecting, scanForDevices, handleCancel])

  const deviceListData = devices.map((device: LedgerDevice) => ({
    title: device.name || 'Ledger Device',
    subtitle: (
      <Text variant="caption" sx={{ fontSize: 12, paddingTop: 4 }}>
        Found over Bluetooth
      </Text>
    ),
    leftIcon: (
      <Icons.Custom.Bluetooth
        color={colors.$textPrimary}
        width={24}
        height={24}
      />
    ),
    accessory: (
      <Button
        type="secondary"
        size="small"
        onPress={() => handleDeviceConnection(device.id, device.name)}
        disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    ),
    onPress: () => handleDeviceConnection(device.id, device.name)
  }))

  return (
    <ScrollScreen
      title={`Connect \nYour Ledger`}
      isModal
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      {isScanning && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 48
          }}>
          <View
            style={{
              position: 'relative',
              width: '100%',
              alignItems: 'center'
            }}>
            <ScanningAnimation size={180} iconSize={28} />

            {/* Text positioned 34px below the center icon */}
            <View
              style={{
                position: 'absolute',
                top: 124, // 90px (center of 180px animation) + 34px below icon
                left: 0,
                right: 0,
                alignItems: 'center'
              }}>
              <Text
                variant="heading6"
                style={{
                  textAlign: 'center',
                  marginBottom: 16
                }}>
                Looking for devices...
              </Text>
              <Text
                variant="body1"
                style={{
                  textAlign: 'center',
                  color: colors.$textSecondary,
                  maxWidth: 280,
                  paddingHorizontal: 20
                }}>
                Make sure your Ledger device is unlocked and the Avalanche app
                is open
              </Text>
            </View>
          </View>
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
          <Icons.Custom.Ledger
            color={colors.$textSecondary}
            width={32}
            height={32}
          />
          <Text variant="heading6" style={{ marginTop: 34 }}>
            Get your Ledger ready
          </Text>
          <Text
            variant="body1"
            style={{
              textAlign: 'center',
              color: colors.$textSecondary,
              marginTop: 8
            }}>
            Make sure your Ledger device is unlocked
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
