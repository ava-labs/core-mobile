import React, { useCallback } from 'react'
import { Space } from 'components/Space'
import TimerSVG from 'components/svg/TimerSVG'
import FlexSpacer from 'components/FlexSpacer'
import { Button, Text, View } from '@avalabs/k2-mobile'
import { useFocusEffect } from '@react-navigation/native'
import { BackHandler } from 'react-native'

export type SessionTimeoutParams = {
  onRetry: () => void
}
export default function SessionTimeout({
  onRetry
}: SessionTimeoutParams): JSX.Element {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => true
      BackHandler.addEventListener('hardwareBackPress', onBackPress)

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress)
    }, [])
  )

  return (
    <View style={{ padding: 16, flex: 1 }}>
      <FlexSpacer />
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 30 }}>
        <TimerSVG />
        <Space y={24} />
        <Text variant={'heading5'}>Your Session has Timed Out</Text>
        <Space y={8} />
        <Text variant={'body2'} style={{ textAlign: 'center' }}>
          The session has expired, press Retry to continue.
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
