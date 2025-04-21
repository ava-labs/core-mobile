import React from 'react'
import { View, Text, Pressable, alpha, useTheme } from '@avalabs/k2-alpine'
import { copyToClipboard } from 'new/common/utils/clipboard'
import { truncateAddress } from '@avalabs/core-utils-sdk'

export const Account = ({ address }: { address: string }): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        paddingVertical: 12
      }}>
      <Text
        variant="body1"
        sx={{ fontSize: 16, lineHeight: 22, color: '$textPrimary' }}>
        Account
      </Text>
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Pressable
          onPress={() => {
            copyToClipboard(address, 'Address copied')
          }}>
          <Text
            variant="mono"
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: alpha(colors.$textPrimary, 0.6)
            }}>
            {truncateAddress(address, 8)}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
