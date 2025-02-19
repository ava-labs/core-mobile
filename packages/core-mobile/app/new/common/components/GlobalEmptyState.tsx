import { Image, Text, View } from '@avalabs/k2-alpine'
import React, { FC } from 'react'

interface Props {
  title: string
  description: string
}

export const GlobalEmptyAssets: FC<Props> = ({
  title,
  description
}): React.JSX.Element => {
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}>
      <Image
        source={require('../../assets/icons/empty_state_emoji.png')}
        sx={{ width: 42, height: 42 }}
      />
      <Text
        variant="heading6"
        sx={{ color: '$textPrimary', marginTop: 32, textAlign: 'center' }}>
        {title}
      </Text>
      <Text
        variant="body2"
        sx={{
          color: '$textSecondary',
          fontSize: 12,
          lineHeight: 16,
          marginTop: 8,
          textAlign: 'center',
          marginHorizontal: 55
        }}>
        {description}
      </Text>
    </View>
  )
}
