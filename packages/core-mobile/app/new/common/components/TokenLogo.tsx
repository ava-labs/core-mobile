import React, { useMemo } from 'react'
import { alpha, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { FC } from 'react'
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

  const containerStyle = useMemo(() => {
    return {
      width: size,
      height: size,
      borderRadius: size,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor,
      borderColor: borderColor,
      borderWidth: BORDER_WIDTH
    }
  }, [backgroundColor, borderColor, size])

  if (isMalicious) {
    return (
      <View sx={containerStyle}>
        <Icons.Custom.RedExclamation width={14} height={14} />
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
      </View>
    )
  }

  return (
    <View sx={containerStyle}>
      <Logo logoUri={logoUri} size={size} backgroundColor={backgroundColor} />
    </View>
  )
}
