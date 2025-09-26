import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import SlideToConfirm from 'common/components/SlideToConfirm'
import { useFocusEffect } from 'expo-router'
import React, { useCallback } from 'react'
import { Keyboard } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradientBottomWrapper } from './LinearGradientBottomWrapper'
import ScreenHeader from './ScreenHeader'

export const ForgotPinComponent = ({
  onCancel,
  onConfirm
}: {
  onCancel: () => void
  onConfirm: () => void
}): JSX.Element => {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  useFocusEffect(
    useCallback(() => {
      Keyboard.dismiss()
    }, [])
  )

  return (
    <View style={{ flex: 1, marginTop: insets.top + 16 }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          {
            padding: 16,
            flex: 1,
            paddingBottom: insets.bottom + 32
          }
        ]}>
        <View>
          <ScreenHeader
            title={`Do you want to\nreset your PIN?`}
            titleNumberOfLines={4}
          />
          <View
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8
            }}>
            <Icons.Alert.ErrorOutline color={theme.colors.$textDanger} />
            <Text
              variant="subtitle1"
              sx={{ color: '$textDanger', flexShrink: 1 }}>
              If you continue, the current wallet session will be terminated and
              you will need to recover your wallet using a social login or
              recovery phrase.
            </Text>
          </View>
        </View>
      </ScrollView>

      <LinearGradientBottomWrapper>
        <View
          style={{
            padding: 16,
            paddingBottom: insets.bottom + 16
          }}>
          <View sx={{ gap: 20 }}>
            <SlideToConfirm onConfirm={onConfirm} text={'Slide to confirm'} />
            <Button
              testID="cancel_btn"
              type="tertiary"
              size="large"
              onPress={onCancel}>
              Cancel
            </Button>
          </View>
        </View>
      </LinearGradientBottomWrapper>
    </View>
  )
}
