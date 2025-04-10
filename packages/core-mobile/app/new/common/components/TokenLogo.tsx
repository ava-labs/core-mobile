import React, { useMemo, FC } from 'react'
import { alpha, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { Platform } from 'react-native'
import { TokenIcon } from 'common/components/TokenIcon'
import {
  hasLocalNetworkTokenLogo,
  hasLocalTokenLogo
} from 'common/utils/hasLocalTokenLogo'
import { Logo } from 'common/components/Logo'

interface TokenAvatarProps {
  symbol: string
  logoUri?: string
  size?: number
  testID?: string
  isMalicious?: boolean
  isNetworkToken?: boolean
}

const DEFAULT_SIZE = 32
const BORDER_WIDTH = 1

export const TokenLogo: FC<TokenAvatarProps> = ({
  symbol,
  logoUri,
  size = DEFAULT_SIZE,
  isMalicious,
  isNetworkToken = false
}) => {
  const {
    theme: { colors, isDark }
  } = useTheme()

  const backgroundColor = colors.$borderPrimary

  const useLocalNetworkTokenLogo =
    isNetworkToken && hasLocalNetworkTokenLogo(symbol)

  // border color is the same no matter where the logo is used
  const borderColor = useMemo(() => {
    return isDark ? alpha(colors.$white, 0.1) : alpha(colors.$black, 0.1)
  }, [colors.$white, colors.$black, isDark])

  // the logo has an inner border style.
  // on iOS, this is achieved by wrapping the logo in a view with `overflow: 'hidden'`.
  // on Android, the above approach doesn't work, so we overlay a border on top of the logo instead.
  const containerStyle = useMemo(() => {
    const baseStyle = {
      width: size,
      height: size,
      borderRadius: size,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor
    }

    return Platform.OS === 'ios'
      ? {
          ...baseStyle,
          borderColor: borderColor,
          borderWidth: BORDER_WIDTH
        }
      : baseStyle
  }, [backgroundColor, borderColor, size])

  // Android-specific border overlay (not needed for iOS)
  const androidBorderOverlay = useMemo(() => {
    if (Platform.OS === 'ios') return null

    return (
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: 'transparent',
          borderColor: borderColor,
          borderWidth: BORDER_WIDTH
        }}
      />
    )
  }, [size, borderColor])

  if (isMalicious) {
    return (
      <View sx={containerStyle}>
        <Icons.Custom.RedExclamation width={14} height={14} />
        {androidBorderOverlay}
      </View>
    )
  }

  if (hasLocalTokenLogo(symbol) || useLocalNetworkTokenLogo) {
    return (
      <View sx={containerStyle}>
        <TokenIcon
          size={size}
          symbol={symbol}
          isNetworkTokenSymbol={useLocalNetworkTokenLogo}
        />
        {androidBorderOverlay}
      </View>
    )
  }

  return (
    <View sx={containerStyle}>
      <Logo logoUri={logoUri} size={size} backgroundColor={backgroundColor} />
      {androidBorderOverlay}
    </View>
  )
}
