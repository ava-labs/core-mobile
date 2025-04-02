import React, { FC, useState } from 'react'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import EthereumSvg from 'components/svg/Ethereum'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import { TokenSymbol } from 'store/network'
import { SvgUri } from 'react-native-svg'
import { formatUriImageToPng, isContentfulImageUri } from 'utils/Contentful'
import { Image } from 'expo-image'
import { Text, useTheme, View, alpha } from '@avalabs/k2-mobile'
import { useGetInitials } from 'hooks/useGetInitials'
import { SuggestedSiteName } from 'store/browser/const'
import { isBase64Png, isSugguestedSiteName } from 'screens/browser/utils'
import { SuggestedSiteIcon } from '../screens/browser/components/SuggestedIcons'

interface AvatarBaseProps {
  title: string
  logoUri?: string
  showBorder?: boolean
  size?: number
  testID?: string
  tokenSymbol?: string
  backgroundColor?: string
  fallbackBackgroundColor?: string
}

const DEFAULT_SIZE = 32

/**
 * Shows given logoUrl as circled avatar.
 * LogoUrl can be valid image or svg.
 * In case if image load fails, it will fall back to circled avatar containing one to max two capital letters from title property
 * A special case is if tokenSymbol is provided then it will return one of 3 predefined token SVGs.
 */
const AvatarBase: FC<AvatarBaseProps> = ({
  title,
  tokenSymbol,
  logoUri,
  showBorder,
  size = DEFAULT_SIZE,
  backgroundColor,
  fallbackBackgroundColor
}) => {
  const { theme } = useTheme()
  const [failedToLoad, setFailedToLoad] = useState(false)

  if (tokenSymbol === TokenSymbol.AVAX || tokenSymbol === 'FAU') {
    return (
      <AvaLogoSVG
        size={size}
        logoColor={theme.colors.$white}
        backgroundColor={theme.colors.$avalancheRed}
      />
    )
  } else if (tokenSymbol === TokenSymbol.ETH) {
    return <EthereumSvg size={size} />
  } else if (tokenSymbol === TokenSymbol.BTC) {
    return <BitcoinSVG size={size} />
  }

  if (isSugguestedSiteName(logoUri)) {
    return (
      <SuggestedSiteIcon
        name={logoUri as SuggestedSiteName}
        sx={{
          width: size,
          height: size,
          borderRadius: size,
          justifyContent: 'center',
          alignItems: 'center'
        }}
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
      <FallbackAvatar
        title={title}
        size={size}
        showBorder={showBorder}
        fallbackBackgroundColor={fallbackBackgroundColor ?? backgroundColor}
        testID="fallback_logo"
      />
    )
  }

  const borderWidth = showBorder ? 0.5 : 0
  const borderColor = showBorder ? '$neutral800' : 'unset'

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
      contentFit="contain"
    />
  )
}

interface TokenAvatarProps {
  name: string
  symbol: string
  logoUri: string | undefined
  size?: number
  testID?: string
  backgroundColor?: string
  showBorder?: boolean
}

const TokenAvatar: FC<TokenAvatarProps> = props => {
  const { theme } = useTheme()
  return (
    <AvatarBase
      {...props}
      title={props.name}
      tokenSymbol={props.symbol}
      testID={props.symbol}
      backgroundColor={props.backgroundColor}
      showBorder={props.showBorder}
      fallbackBackgroundColor={alpha(theme.colors.$neutral700, 0.5)}
    />
  )
}

interface CustomAvatarProps {
  name: string
  symbol?: string
  logoUri?: string
  showBorder?: boolean
  size?: number
  circleColor?: string
  testID?: string
}

const CustomAvatar: FC<CustomAvatarProps> = props => {
  return (
    <AvatarBase
      {...props}
      title={props.name}
      backgroundColor={props.circleColor}
      tokenSymbol={props.symbol}
      testID={props.testID ?? 'avatar__custom_avatar'}
    />
  )
}
const BasicAvatar: FC<AvatarBaseProps> = props => {
  return (
    <AvatarBase {...props} testID={props.testID ?? 'avatar__custom_avatar'} />
  )
}

function FallbackAvatar({
  title,
  size = DEFAULT_SIZE,
  fallbackBackgroundColor,
  showBorder,
  testID
}: AvatarBaseProps): JSX.Element {
  const initials = useGetInitials(title)

  return (
    <View
      sx={{
        width: size,
        height: size,
        borderRadius: size,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: fallbackBackgroundColor,
        borderWidth: showBorder ? 0.5 : 0,
        borderColor: showBorder ? '$neutral800' : 'unset'
      }}>
      <Text
        testID={testID}
        variant="body1"
        sx={{
          color: '$neutral50',
          fontSize: size * 0.4,
          lineHeight: size * 0.65
        }}>
        {initials}
      </Text>
    </View>
  )
}

const Avatar = {
  Token: TokenAvatar,
  /**
   * @deprecated - use Basic
   */
  Custom: CustomAvatar,
  Basic: BasicAvatar
}

export default Avatar
