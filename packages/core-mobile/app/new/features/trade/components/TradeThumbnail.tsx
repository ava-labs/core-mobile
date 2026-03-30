import React from 'react'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { Image } from 'expo-image'

export const TradeThumbnail = ({
  url,
  variant = 'default'
}: {
  url?: string | null
  variant?: 'default' | 'small'
}): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        width: variant === 'small' ? 18 : 30,
        height: variant === 'small' ? 18 : 30,
        borderRadius: variant === 'small' ? 5 : 8,
        backgroundColor: theme.colors.$surfacePrimary,
        borderWidth: 1,
        borderColor: theme.colors.$borderPrimary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={{
            width: variant === 'small' ? 18 : 30,
            height: variant === 'small' ? 18 : 30
          }}
          contentFit="cover"
        />
      ) : null}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          top: 0,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Icons.Custom.Prediction
          color={theme.colors.$textPrimary}
          width={variant === 'small' ? 8 : 20}
          height={variant === 'small' ? 8 : 20}
        />
      </View>
    </View>
  )
}
