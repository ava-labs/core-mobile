import { Button, Image, Text, View } from '@avalabs/k2-alpine'
import React from 'react'

export const ErrorState = ({
  onPress
}: {
  onPress: () => void
}): React.JSX.Element => {
  return (
    <View
      sx={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
      <Image
        source={require('../../../../assets/icons/error_state_emoji.png')}
        sx={{ width: 42, height: 42 }}
      />
      <Text
        variant="heading6"
        sx={{ color: '$textPrimary', marginTop: 32, textAlign: 'center' }}>
        Oops! Something went wrong
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
        Please hit refresh or try again later
      </Text>
      <Button
        size="medium"
        type="secondary"
        style={{ marginTop: 16 }}
        onPress={onPress}>
        Refresh
      </Button>
    </View>
  )
}
