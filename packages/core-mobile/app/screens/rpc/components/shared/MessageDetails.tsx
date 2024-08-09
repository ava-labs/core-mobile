import React from 'react'
import { View, Text } from '@avalabs/k2-mobile'

export const MessageDetails = ({
  details
}: {
  details: string
}): React.JSX.Element => {
  return (
    <View>
      <Text variant="buttonMedium">Message:</Text>
      <View
        sx={{
          justifyContent: 'space-between',
          marginTop: 16,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          backgroundColor: '$neutral800'
        }}>
        <Text testID="message_detail" variant="body1">
          {details}
        </Text>
      </View>
    </View>
  )
}
