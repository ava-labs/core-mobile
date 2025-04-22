import React from 'react'
import { View, Text, alpha, useTheme } from '@avalabs/k2-alpine'
import { TokenLogo } from 'new/common/components/TokenLogo'

export const Network = ({
  logoUri,
  name
}: {
  logoUri: string | undefined
  name: string
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        paddingVertical: 12
      }}>
      <Text
        variant="body1"
        sx={{ fontSize: 16, lineHeight: 22, color: '$textPrimary' }}>
        Network
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          maxWidth: '60%',
          flex: 1,
          justifyContent: 'flex-end'
        }}>
        <TokenLogo logoUri={logoUri} size={24} />
        <Text
          variant="body1"
          numberOfLines={1}
          sx={{
            fontSize: 16,
            lineHeight: 22,
            color: alpha(colors.$textPrimary, 0.6)
          }}>
          {name}
        </Text>
      </View>
    </View>
  )
}
