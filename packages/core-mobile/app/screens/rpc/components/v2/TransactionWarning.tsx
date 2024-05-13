import { Icons, Text, View, useTheme } from '@avalabs/k2-mobile'
import React from 'react'

const TransactionWarning = ({
  type
}: {
  type: 'Malicious' | 'Warning'
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const textStyle = { color: '$black', fontSize: 13, lineHeight: 16 }

  const content =
    type === 'Malicious'
      ? {
          icon: <Icons.Social.RemoveModerator color={colors.$black} />,
          title: 'Scam Transaction',
          subtitle: 'This transaction is malicious, do not proceed.'
        }
      : {
          icon: <Icons.Device.IconGPPMaybe color={colors.$black} />,
          title: 'Suspicious Transaction',
          subtitle: 'Use caution, this transaction may be malicious.'
        }

  return (
    <View
      sx={{
        padding: 16,
        borderRadius: 8,
        backgroundColor:
          type === 'Malicious' ? '$dangerLight' : '$warningLight',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13
      }}>
      {content.icon}
      <View>
        <Text sx={{ ...textStyle, fontWeight: '600' }}>{content.title}</Text>
        <Text sx={{ ...textStyle }}>{content.subtitle}</Text>
      </View>
    </View>
  )
}

export default TransactionWarning
