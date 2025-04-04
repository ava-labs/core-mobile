import React from 'react'
import { Image } from '@avalabs/k2-alpine'
import { FC, useState } from 'react'
import { isBase64Png } from 'screens/browser/utils'
import { formatUriImageToPng, isContentfulImageUri } from 'utils/Contentful'
import { SvgUri } from 'react-native-svg'
import { FallbackLogo } from './FallbackLogo'

interface LogoProps {
  logoUri?: string
  size?: number
  testID?: string
  backgroundColor?: string
  borderColor?: string
}

const DEFAULT_SIZE = 32

export const Logo: FC<LogoProps> = ({
  logoUri,
  borderColor,
  size = DEFAULT_SIZE,
  backgroundColor
}) => {
  const [failedToLoad, setFailedToLoad] = useState(false)

  const borderWidth = borderColor ? 1 : 0

  const hasValidLogoUri =
    !!logoUri &&
    (logoUri.startsWith('http') ||
      logoUri.startsWith('https') ||
      isBase64Png(logoUri)) &&
    !failedToLoad

  if (!hasValidLogoUri) {
    return (
      <FallbackLogo
        size={size}
        borderColor={borderColor}
        backgroundColor={backgroundColor}
        testID="fallback_logo"
      />
    )
  }

  return logoUri?.endsWith('svg') && !isContentfulImageUri(logoUri) ? (
    <SvgUri
      uri={logoUri}
      width={size}
      height={size}
      style={{
        borderRadius: size,
        backgroundColor,
        borderWidth,
        borderColor
      }}
      onLoad={() => setFailedToLoad(false)}
      onError={() => setFailedToLoad(true)}
      testID="avatar__logo_avatar"
    />
  ) : (
    <Image
      style={{
        borderRadius: size,
        width: size,
        height: size,
        backgroundColor: backgroundColor,
        borderWidth,
        borderColor
      }}
      source={{
        uri: isContentfulImageUri(logoUri)
          ? formatUriImageToPng(logoUri, size)
          : logoUri
      }}
      onLoad={() => setFailedToLoad(false)}
      onError={() => setFailedToLoad(true)}
      testID="avatar__logo_avatar"
    />
  )
}
