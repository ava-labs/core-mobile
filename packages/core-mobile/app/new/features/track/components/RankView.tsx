import React from 'react'
import { SxProp, Text, useTheme, View } from '@avalabs/k2-alpine'
import Wreath from '../../../assets/icons/wreath.svg'

export const RankView = ({
  rank,
  sx
}: {
  rank: number
  sx?: SxProp
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View sx={sx}>
      <Wreath color={theme.colors.$textSecondary} />
      <View
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Text variant="heading3" sx={{ color: '$textSecondary' }}>
          {rank}
        </Text>
        <Text
          sx={{
            color: '$textSecondary',
            fontFamily: 'Inter-Regular',
            fontWeight: '500',
            fontSize: 10,
            lineHeight: 12
          }}>
          Rank
        </Text>
      </View>
    </View>
  )
}
