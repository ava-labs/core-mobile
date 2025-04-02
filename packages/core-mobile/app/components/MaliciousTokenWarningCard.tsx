import { Icons, Text, useTheme, View } from '@avalabs/k2-mobile'
import React from 'react'
import Card from './Card'

export const MaliciousTokenWarningCard = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <Card
      style={{
        backgroundColor: colors.$warningLight,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
      }}>
      <Icons.Device.IconGPPMaybe color={colors.$black} />
      <View sx={{ flex: 1 }}>
        <Text variant="heading6" sx={{ color: '$neutral900' }}>
          Malicious Token
        </Text>
        <Text variant="body2" sx={{ color: '$neutral900' }}>
          This token has been flagged as malicious. Use caution when interacting
          with it.
        </Text>
      </View>
    </Card>
  )
}
