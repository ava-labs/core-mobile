import React from 'react'
import { BottomSheet } from 'components/BottomSheet'
import { Button, View } from '@avalabs/k2-mobile'
import { Space } from 'components/Space'

type Props = {
  children: React.ReactNode
  onClose: () => void
  showButtons?: boolean
  onApprove?: () => void
  onReject?: () => void
  testID?: string
}

const RpcRequestBottomSheet: React.FC<Props> = ({
  children,
  onClose,
  showButtons,
  onApprove,
  onReject
}) => {
  const shouldShowButtons = !!showButtons && !!onApprove && !!onReject

  return (
    <BottomSheet enableContentPanningGesture={false} onClose={onClose}>
      {children}
      {shouldShowButtons && (
        <View
          sx={{
            backgroundColor: '$neutral900',
            paddingVertical: 16,
            marginHorizontal: 16
          }}>
          <Button
            type="primary"
            size="xlarge"
            onPress={onApprove}
            testID="approve_btn">
            Approve
          </Button>
          <Space y={16} />
          <Button
            type="secondary"
            size="xlarge"
            onPress={onReject}
            testID="reject_btn">
            Reject
          </Button>
        </View>
      )}
    </BottomSheet>
  )
}

export default RpcRequestBottomSheet
