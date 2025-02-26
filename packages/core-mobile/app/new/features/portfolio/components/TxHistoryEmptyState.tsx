import { Image, Text, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Dimensions } from 'react-native'

const WINDOW_HEIGHT = Dimensions.get('window').height

export const TxHistoryEmptyState = (): React.JSX.Element => {
  return (
    <View
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        height: WINDOW_HEIGHT / 2 - 32
      }}>
      <Image
        source={require('../../../assets/icons/empty_state_frown_emoji.png')}
        sx={{ width: 42, height: 42 }}
      />
      <Text
        variant="heading6"
        sx={{
          color: '$textPrimary',
          marginTop: 32,
          textAlign: 'center',
          paddingHorizontal: 64
        }}>
        No recent transactions
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
        Interact with this token onchain and see your activity here
      </Text>
    </View>
  )
}
