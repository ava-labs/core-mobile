import { Logos, View, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { selectIsIdled } from 'store/app/slice'
import { useSelector } from 'react-redux'
import { useBgDetect } from 'common/hooks/useBgDetect'
import { Platform } from 'react-native'
import { FullWindowOverlay } from 'react-native-screens'

export const PrivacyScreen = (): JSX.Element | null => {
  const isIdled = useSelector(selectIsIdled)
  const { inBackground } = useBgDetect()

  if (isIdled || inBackground) {
    return Platform.OS === 'ios' ? (
      <FullWindowOverlay>
        <Privacy />
      </FullWindowOverlay>
    ) : (
      <Privacy />
    )
  }

  return null
}

const Privacy = (): JSX.Element => {
  const { theme } = useTheme()
  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
      }}>
      <Logos.AppIcons.Core color={theme.colors.$textPrimary} />
    </View>
  )
}
