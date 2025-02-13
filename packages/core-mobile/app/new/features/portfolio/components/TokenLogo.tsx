import React from 'react'
import { Image, useTheme } from '@avalabs/k2-alpine'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { FC, useState } from 'react'
import { TokenSymbol } from 'store/network'
import { isBase64Png } from 'screens/browser/utils'
import { formatUriImageToPng, isContentfulImageUri } from 'utils/Contentful'
import { SvgUri } from 'react-native-svg'
import { FallbackTokenLogo } from './FallbackTokenLogo'

interface TokenAvatarProps {
  symbol: string
  logoUri: string | undefined
  size?: number
  testID?: string
  backgroundColor?: string
  borderColor?: string
}

const DEFAULT_SIZE = 32

export const TokenLogo: FC<TokenAvatarProps> = ({
  symbol,
  logoUri,
  borderColor,
  size = DEFAULT_SIZE,
  backgroundColor
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const [failedToLoad, setFailedToLoad] = useState(false)

  const borderWidth = borderColor ? 1 : 0

  if (symbol === TokenSymbol.AVAX || symbol === 'FAU') {
    return (
      <AvaLogoSVG
        size={size}
        logoColor={'#FFFFFF'} // Avalanche logo shoud be white
        backgroundColor={colors.$textDanger}
      />
    )
  }

  const hasValidLogoUri =
    !!logoUri &&
    (logoUri.startsWith('http') ||
      logoUri.startsWith('https') ||
      isBase64Png(logoUri)) &&
    !failedToLoad

  if (!hasValidLogoUri) {
    return (
      <FallbackTokenLogo
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
        backgroundColor: backgroundColor,
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
