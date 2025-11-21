import React, { useMemo } from 'react'
import { View } from 'react-native'
import {
  Text,
  Button,
  useTheme,
  GroupList,
  Icons,
  GroupListItem
} from '@avalabs/k2-alpine'

interface LedgerDevice {
  id: string
  name: string
}

interface LedgerDeviceListProps {
  devices: LedgerDevice[]
  onDevicePress?: (deviceId: string, deviceName: string) => void
  isConnecting?: boolean
  itemHeight?: number
  subtitleText?: string
  buttonText?: string
  buttonLoadingText?: string
  testID?: string
}

export const LedgerDeviceList: React.FC<LedgerDeviceListProps> = ({
  devices,
  onDevicePress,
  isConnecting = false,
  itemHeight = 56,
  subtitleText = 'Found over Bluetooth',
  buttonText = 'Connect',
  buttonLoadingText = 'Connecting...',
  testID
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const deviceListData: GroupListItem[] = useMemo(
    () =>
      devices.map((device: LedgerDevice) => ({
        title: device.name || 'Ledger Device',
        subtitle: (
          <Text
            variant="caption"
            sx={{ fontSize: 12, paddingTop: 4, color: colors.$textSecondary }}>
            {subtitleText}
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
        ...(onDevicePress && {
          accessory: (
            <Button
              type="primary"
              size="small"
              onPress={() => onDevicePress(device.id, device.name)}
              disabled={isConnecting}>
              {isConnecting ? buttonLoadingText : buttonText}
            </Button>
          ),
          onPress: () => onDevicePress(device.id, device.name)
        })
      })),
    [
      devices,
      colors.$textSecondary,
      colors.$surfaceSecondary,
      colors.$textPrimary,
      onDevicePress,
      isConnecting,
      buttonText,
      buttonLoadingText,
      subtitleText
    ]
  )

  if (devices.length === 0) {
    return null
  }

  return (
    <GroupList itemHeight={itemHeight} data={deviceListData} testID={testID} />
  )
}
