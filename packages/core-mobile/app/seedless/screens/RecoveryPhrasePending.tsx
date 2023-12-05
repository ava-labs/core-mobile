import { Button, Text, View } from '@avalabs/k2-mobile'
import React from 'react'
import { Space } from 'components/Space'

const DAY_REMAINING = 2

interface Props {
  onCancel: () => void
}

export const RecoveryPhrasePending = ({ onCancel }: Props): JSX.Element => {
  return (
    <View
      sx={{ marginHorizontal: 16, flex: 1, justifyContent: 'space-between' }}>
      <View>
        <Text variant="heading3">Recovery Phrase</Text>
        <Space y={80} />
        <View
          sx={{
            backgroundColor: '$altOrange1',
            marginVertical: 32,
            height: 153
          }}
        />

        <View sx={{ alignItems: 'center', marginHorizontal: 36 }}>
          <Text variant="heading5" sx={{ color: '$neutral50' }}>
            {DAY_REMAINING > 1
              ? `${DAY_REMAINING} Days Remaining`
              : `${DAY_REMAINING} Day Remaining`}
          </Text>
          <Space y={8} />
          <Text
            variant="body2"
            sx={{ color: '$neutral400', textAlign: 'center' }}>
            Your recovery phrase is loading. Please check back in a little
            while.
          </Text>
        </View>
      </View>
      <Button
        type="secondary"
        size="xlarge"
        style={{ marginVertical: 16 }}
        onPress={onCancel}>
        Cancel
      </Button>
    </View>
  )
}
