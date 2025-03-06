import { Image, Text, View } from '@avalabs/k2-alpine'
import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

interface Props {
  title: string
  description: string
  style?: ViewStyle
}

export const GlobalEmptyAssets: FC<Props> = ({
  title,
  description,
  style
}): React.JSX.Element => {
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        ...style
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
