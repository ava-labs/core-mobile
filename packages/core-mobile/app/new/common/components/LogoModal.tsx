import { Logos, View, useTheme } from '@avalabs/k2-alpine'
import React from 'react'

export const LogoModal = (): JSX.Element => {
  const { theme } = useTheme()
  // Hello UI: continue the native bootsplash visually — black bg with
  // the white Moto wing centered. Default theme keeps the Core wordmark
  // on $surfacePrimary.
  const isMoto = theme.variant === 'moto'

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: isMoto ? '#000000' : theme.colors.$surfacePrimary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
      }}>
      {isMoto ? (
        <Logos.AppIcons.MotoWing width={80} height={80} color="#FFFFFF" />
      ) : (
        <Logos.AppIcons.Core color={theme.colors.$textPrimary} />
      )}
    </View>
  )
}
