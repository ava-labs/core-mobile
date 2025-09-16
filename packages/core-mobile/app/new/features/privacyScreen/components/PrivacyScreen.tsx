import { Logos, View, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { selectIsIdled } from 'store/app/slice'
import { useSelector } from 'react-redux'
import { useBgDetect } from 'common/hooks/useBgDetect'
import { FullWindowOverlay } from 'react-native-screens'

export const PrivacyScreen = (): JSX.Element | null => {
  const isIdled = useSelector(selectIsIdled)
  const { inBackground } = useBgDetect()
  const {
    theme: { colors }
  } = useTheme()

  if (isIdled || inBackground) {
    return (
      <FullWindowOverlay
        // @ts-ignore: FullWindowOverlayProps is not typed with style, but we can still apply style to Android React Native View component
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: colors.$surfacePrimary
        }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          <Logos.AppIcons.Core color={colors.$textPrimary} />
        </View>
      </FullWindowOverlay>
    )
  }

  return null
}
