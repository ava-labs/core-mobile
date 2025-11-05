import React, { useCallback } from 'react'
import { View, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, Button, useTheme, GroupList, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import { AnimatedIconWithText } from 'new/features/ledger/components/AnimatedIconWithText'

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

  const deviceListData = devices.map((device: LedgerDevice) => ({
    title: device.name || 'Ledger Device',
    subtitle: (
      <Text
        variant="caption"
        sx={{ fontSize: 12, paddingTop: 4, color: colors.$textSecondary }}>
        Found over Bluetooth
      </Text>
    ),
    leftIcon: (
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.$surfaceSecondary,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Custom.Bluetooth
          color={colors.$textPrimary}
          width={24}
          height={24}
        />
      </View>
    ),
    accessory: (
      <Button
        type="primary"
        size="small"
        onPress={() => handleDeviceConnection(device.id, device.name)}
        disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect'}
      </Button>
    ),
    onPress: () => handleDeviceConnection(device.id, device.name)
  }))

  const renderFooter = useCallback(() => {
    return (
      <View style={{ padding: 16, gap: 12 }}>
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
            <ActivityIndicator size="small" color={colors.$textPrimary} />
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
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      {isScanning && (
        <AnimatedIconWithText
          icon={
            <Icons.Custom.Ledger
              color={colors.$textPrimary}
              width={44}
              height={44}
            />
          }
          title="Looking for devices..."
          subtitle="Make sure your Ledger device is unlocked and the Avalanche app is open"
          showAnimation={true}
        />
      )}

      {!isScanning && devices.length === 0 && (
        <AnimatedIconWithText
          icon={
            <Icons.Custom.Ledger
              color={colors.$textPrimary}
              width={44}
              height={44}
            />
          }
          title="Get your Ledger ready"
          subtitle="Make sure your Ledger device is unlocked and ready to connect"
          showAnimation={false}
        />
      )}

      {devices.length > 0 && (
        <View
          style={{
            flex: 1,
            ...(isScanning
              ? { justifyContent: 'flex-end', marginBottom: -20 }
              : { paddingTop: 24 })
          }}>
          <GroupList itemHeight={56} data={deviceListData} />
        </View>
      )}
    </ScrollScreen>
  )
}
