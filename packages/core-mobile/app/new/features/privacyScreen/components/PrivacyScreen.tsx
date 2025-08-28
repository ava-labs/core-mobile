import { Logos, View, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { useBgDetect } from 'common/hooks/useBgDetect'
import { useSelector } from 'react-redux'
import { selectIsIdled } from 'store/app'

export const PrivacyScreen = (): JSX.Element | null => {
  const { inBackground } = useBgDetect()
  const isIdled = useSelector(selectIsIdled)
  const { theme } = useTheme()

  if (isIdled || inBackground) {
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

  return null
}
