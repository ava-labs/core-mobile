import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradientBottomWrapper } from 'new/common/components/LinearGradientBottomWrapper'
import { View, Button } from '@avalabs/k2-alpine'
import { Space } from 'components/Space'

export type ActionButtonsProps = {
  confirm: {
    label: string
    onPress: () => void
    disabled?: boolean
  }
  cancel: {
    label: string
    onPress: () => void
    disabled?: boolean
  }
}

export const ActionButtons = ({
  confirm,
  cancel
}: ActionButtonsProps): JSX.Element => {
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
            onPress={() => confirm.onPress()}
            disabled={confirm.disabled}>
            {confirm.label}
          </Button>
          <Space y={16} />
          <Button
            size="large"
            type="tertiary"
            onPress={() => cancel.onPress()}
            disabled={cancel.disabled}>
            {cancel.label}
          </Button>
        </View>
      </LinearGradientBottomWrapper>
    </View>
  )
}
