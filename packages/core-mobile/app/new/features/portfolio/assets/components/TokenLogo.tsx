import React from 'react'
import { Icons, Image, View } from '@avalabs/k2-alpine'
import { FC, useState } from 'react'
import { isBase64Png } from 'screens/browser/utils'
import { formatUriImageToPng, isContentfulImageUri } from 'utils/Contentful'
import { SvgUri } from 'react-native-svg'
import { TokenIcon } from 'common/components/TokenIcon'
import {
  hasLocalNetworkTokenLogo,
  hasLocalTokenLogo
} from 'common/utils/hasLocalTokenLogo'
import { FallbackTokenLogo } from './FallbackTokenLogo'

interface TokenAvatarProps {
  symbol: string
  logoUri?: string
  size?: number
  testID?: string
  backgroundColor?: string
  borderColor?: string
  isMalicious?: boolean
  isNetworkToken?: boolean
}

const DEFAULT_SIZE = 32

export const TokenLogo: FC<TokenAvatarProps> = ({
  symbol,
  logoUri,
  borderColor,
  size = DEFAULT_SIZE,
  backgroundColor,
  isMalicious,
  isNetworkToken = false
}) => {
  const useLocalNetworkTokenLogo =
    isNetworkToken && hasLocalNetworkTokenLogo(symbol)

  const [failedToLoad, setFailedToLoad] = useState(false)

  const borderWidth = borderColor ? 1 : 0

  if (isMalicious) {
    return (
      <View
        sx={{
          width: size,
          height: size,
          borderRadius: size,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor,
          borderColor,
          borderWidth
        }}>
        <Icons.Custom.RedExclamation width={14} height={14} />
      </View>
    )
  }

  if (hasLocalTokenLogo(symbol) || useLocalNetworkTokenLogo) {
    return (
      <View
        sx={{
          width: size,
          height: size,
          borderRadius: size,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor,
          borderColor,
          borderWidth
        }}>
        <TokenIcon
          size={size}
          symbol={symbol}
          isNetworkTokenSymbol={useLocalNetworkTokenLogo}
        />
      </View>
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
