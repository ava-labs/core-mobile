import { Logos, View, useTheme } from '@avalabs/k2-alpine'
import React from 'react'
import { selectIsIdled } from 'store/app/slice'
import { useSelector } from 'react-redux'
import { useBgDetect } from 'common/hooks/useBgDetect'

export const PrivacyScreen = (): JSX.Element | null => {
  const isIdled = useSelector(selectIsIdled)
  const { inBackground } = useBgDetect()
  const {
    theme: { colors }
  } = useTheme()

  if (isIdled || inBackground) {
    return (
      <View
        style={{
          flex: 1,
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: colors.$surfacePrimary,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Logos.AppIcons.Core color={colors.$textPrimary} />
      </View>
    )
  }

  return null
}
