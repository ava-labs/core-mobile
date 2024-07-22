import React from 'react'
import { View, Text, alpha, useTheme } from '@avalabs/k2-mobile'
import { Space } from './Space'
import InfoSVG from './svg/InfoSVG'

export const Banner = ({
  title,
  description
}: {
  title: string
  description: string
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        flexDirection: 'row',
        borderColor: '$warningLight',
        borderRadius: 8,
        borderWidth: 1,
        padding: 16,
        backgroundColor: alpha(colors.$warningDark, 0.1),
        alignItems: 'center',
        marginBottom: 16
      }}>
      <InfoSVG color={colors.$warningLight} size={24} />
      <Space x={12} />
      <View sx={{ flex: 1 }}>
        <Text variant="alertTitle">{title}</Text>
        <Text variant="alertDescription">{description}</Text>
      </View>
    </View>
  )
}
