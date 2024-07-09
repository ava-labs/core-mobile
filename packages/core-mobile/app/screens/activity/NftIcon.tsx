import React from 'react'
import { Image, Text, View, useTheme } from '@avalabs/k2-mobile'
import { useGetInitials } from 'hooks/useGetInitials'

const SIZE = 40

export const NftIcon = ({
  nftUrl,
  title
}: {
  nftUrl: string
  title?: string
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const initials = useGetInitials(title)

  return (
    <View
      style={{
        height: SIZE,
        width: SIZE,
        borderRadius: SIZE / 2,
        backgroundColor: colors.$neutral800,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Text
        variant="body1"
        sx={{
          color: '$blueMain',
          fontSize: SIZE / 3,
          lineHeight: SIZE * 0.75
        }}>
        {initials}
      </Text>
      <Image
        source={{ uri: nftUrl }}
        style={{
          height: SIZE,
          width: SIZE,
          borderRadius: SIZE / 2,
          position: 'absolute'
        }}
      />
    </View>
  )
}
