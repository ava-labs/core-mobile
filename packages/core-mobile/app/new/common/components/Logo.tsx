import React from 'react'
import { Image } from 'expo-image'
// import { NitroImage } from 'react-native-nitro-image'
// import WebImage from 'react-native-nitro-web-image'
import { FC, useState } from 'react'
import { formatUriImageToPng, isContentfulImageUri } from 'utils/Contentful'
import { SvgUri } from 'react-native-svg'
import { isBase64Png } from '../utils/isBase64Png'
import { FallbackLogo } from './FallbackLogo'

interface LogoProps {
  logoUri?: string
  size?: number
  testID?: string
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number
}

const DEFAULT_SIZE = 32

export const Logo: FC<LogoProps> = ({
  logoUri,
  borderColor,
  size = DEFAULT_SIZE,
  backgroundColor,
  borderRadius
}) => {
  const [failedToLoad, setFailedToLoad] = useState(false)

  const borderWidth = borderColor ? 1 : 0
  const borderRadiusValue = borderRadius ?? size
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
        borderRadius={borderRadius}
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
        borderRadius: borderRadiusValue,
        backgroundColor,
        borderWidth,
        borderColor
      }}
      onLoad={() => setFailedToLoad(false)}
      onError={() => setFailedToLoad(true)}
      testID="avatar__logo_avatar"
    />
  ) : (
    // <NitroImage
    //   image={{
    //     url: isContentfulImageUri(logoUri)
    //       ? formatUriImageToPng(logoUri, size)
    //       : logoUri
    //   }}
    //   style={{
    //     borderRadius: borderRadiusValue,
    //     width: size,
    //     height: size,
    //     backgroundColor: backgroundColor,
    //     borderWidth,
    //     borderColor
    //   }}
    //   testID="avatar__logo_avatar"
    // />
    <Image
      style={{
        borderRadius: borderRadiusValue,
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
