import React, { useState } from 'react'
import { SvgUri } from 'react-native-svg'
import { Image, Text, View } from '@avalabs/k2-mobile'

export type AvatarParams = {
  title: string
  size?: number
  logoUrl?: string
  backgroundColor?: string
  errorBackgroundColor?: string
}

/**
 * Shows given logoUrl as circled avatar.
 * LogoUrl can be valid image or svg.
 * In case if image load fails, it will fallback to circled avatar containing one to max two capital letters from title
 */
export function Avatar2({
  title,
  size = 48,
  logoUrl,
  backgroundColor,
  errorBackgroundColor
}: AvatarParams): JSX.Element {
  const [hasLoadError, setHasLoadError] = useState(false)

  if (hasLoadError) {
    return (
      <FallbackAvatar
        title={title}
        size={size}
        errorBackgroundColor={errorBackgroundColor}
      />
    )
  }

  return logoUrl?.endsWith('svg') ? (
    <SvgUri
      uri={logoUrl}
      width={size}
      height={size}
      style={{
        borderRadius: size / 2,
        backgroundColor: backgroundColor
      }}
      onLoad={() => setHasLoadError(false)}
      onError={() => setHasLoadError(true)}
    />
  ) : (
    <Image
      source={{ uri: logoUrl }}
      sx={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: backgroundColor
      }}
      onLoad={() => setHasLoadError(false)}
      onError={() => setHasLoadError(true)}
    />
  )
}

function FallbackAvatar({
  title,
  size,
  errorBackgroundColor
}: AvatarParams): JSX.Element {
  const names = (title ?? '').split(' ')

  const initials =
    names.length > 1
      ? names[0]?.substring(0, 1) ??
        '' + names[names.length - 1]?.substring(0, 1) ??
        ''
      : names[0]?.substring(0, 1) ?? ''

  return (
    <View
      sx={{
        width: size,
        height: size,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: errorBackgroundColor
      }}>
      <Text
        variant="body1"
        sx={{ color: '$neutral50', fontSize: 24, lineHeight: 36 }}>
        {initials}
      </Text>
    </View>
  )
}
