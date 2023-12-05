import React from 'react'
import { Space } from 'components/Space'
import FlexSpacer from 'components/FlexSpacer'
import { Button, Text, View } from '@avalabs/k2-mobile'
import ErrorOutlineSVG from 'components/svg/ErrorOutlineSVG'

export type WrongIdParams = {
  onRetry: () => void
}
export default function WrongSocialAccount({
  onRetry
}: WrongIdParams): JSX.Element {
  return (
    <View style={{ padding: 16, flex: 1 }}>
      <FlexSpacer />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 30 }}>
        <ErrorOutlineSVG />
        <Space y={24} />
        <Text variant={'heading5'}>Wrong email address</Text>
        <Space y={8} />
        <Text variant={'body2'} style={{ textAlign: 'center' }}>
          Please log in with the email address you used when you created your
          wallet.
        </Text>
      </View>
      <FlexSpacer />
      <Button
        size={'xlarge'}
        type={'primary'}
        onPress={onRetry}
        style={{ width: '100%' }}>
        Retry
      </Button>
    </View>
  )
}
