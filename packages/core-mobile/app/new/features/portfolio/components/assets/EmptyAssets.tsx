import { Image, Text, View } from '@avalabs/k2-alpine'
import React from 'react'
import { Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const WINDOW_HEIGHT = Dimensions.get('window').height

export const EmptyAssets = (): React.JSX.Element => {
  const safeArea = useSafeAreaInsets()

  return (
    <View
      sx={{
        height: WINDOW_HEIGHT - safeArea.top - safeArea.bottom,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }}>
      <Image
        source={require('../../../../assets/icons/owl.png')}
        sx={{ width: 42, height: 42 }}
      />
      <Text
        variant="heading6"
        sx={{ color: '$textPrimary', marginTop: 32, textAlign: 'center' }}>
        No Assets yet
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
        Add your crypto tokens to track your portfolio’s performance and stay
        updated on your investments
      </Text>
    </View>
  )
}
