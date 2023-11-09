import { Text, View, useTheme } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'
import CheckmarkSVG from 'components/svg/CheckmarkSVG'
import React from 'react'

export const SnackBarMessage = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        sx={{
          backgroundColor: '$successMain',
          width: 20,
          height: 20,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <CheckmarkSVG size={14} color={colors.$neutral850} />
      </View>
      <Space x={4} />
      <Text variant="buttonMedium">Key Copied</Text>
    </View>
  )
}
