import { Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import React from 'react'

export const AlertBody = ({ reasons }: { reasons: string[] }): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16
      }}>
      <Icons.Alert.ErrorOutline
        width={20}
        height={20}
        color={colors.$textDanger}
      />
      <View sx={{ flex: 1, marginLeft: 8 }}>
        {reasons.map((reason, index) => (
          <Text
            key={index}
            variant="buttonMedium"
            sx={{
              fontSize: 13,
              color: '$textDanger',
              marginTop: index > 0 ? 8 : 0
            }}>
            {reason}
          </Text>
        ))}
      </View>
    </View>
  )
}
