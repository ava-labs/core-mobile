import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradientBottomWrapper } from 'new/common/components/LinearGradientBottomWrapper'
import { View, Button } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'

export const ActionButtons = ({
  onApprove,
  approveDisabled,
  onReject,
  rejectDisabled
}: {
  onApprove: () => void
  approveDisabled: boolean
  onReject: () => void
  rejectDisabled: boolean
}): JSX.Element => {
  const { bottom } = useSafeAreaInsets()

  return (
    <View
      style={{
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0
      }}>
      <LinearGradientBottomWrapper>
        <View
          sx={{
            paddingHorizontal: 16,
            backgroundColor: '$surfacePrimary',
            paddingBottom: bottom + 16
          }}>
          <Button
            size="large"
            type="primary"
            onPress={onApprove}
            disabled={approveDisabled}>
            Approve
          </Button>
          <Space y={16} />
          <Button
            size="large"
            type="tertiary"
            onPress={onReject}
            disabled={rejectDisabled}>
            Reject
          </Button>
        </View>
      </LinearGradientBottomWrapper>
    </View>
  )
}
