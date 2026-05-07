import { Logos, View, useTheme } from '@avalabs/k2-alpine'
import React, { useCallback } from 'react'
import { selectIsIdled } from 'store/app/slice'
import { useSelector } from 'react-redux'
import { useBgDetect } from 'common/hooks/useBgDetect'
import { FullWindowOverlay } from 'react-native-screens'
import { useFocusEffect } from 'expo-router'
import { Keyboard } from 'react-native'

export const PrivacyScreen = (): JSX.Element | null => {
  const isIdled = useSelector(selectIsIdled)
  const { inBackground } = useBgDetect()
  const {
    theme,
    theme: { colors }
  } = useTheme()
  // Hello UI: privacy overlay matches the bootsplash — black bg + white
  // Moto wing. Default theme keeps the surface-primary + Core wordmark.
  const isMoto = theme.variant === 'moto'
  const overlayBg = isMoto ? '#000000' : colors.$surfacePrimary

  useFocusEffect(
    useCallback(() => {
      Keyboard.dismiss()
    }, [])
  )

  if (isIdled || inBackground) {
    return (
      <FullWindowOverlay
        // @ts-ignore: FullWindowOverlayProps is not typed with style, but we can still apply style to Android React Native View component
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: overlayBg
        }}>
        <View
          style={{
            flex: 1,
            backgroundColor: overlayBg,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          {isMoto ? (
            <Logos.AppIcons.MotoTetherWing width={160} height={84} />
          ) : (
            <Logos.AppIcons.Core color={colors.$textPrimary} />
          )}
        </View>
      </FullWindowOverlay>
    )
  }

  return null
}
