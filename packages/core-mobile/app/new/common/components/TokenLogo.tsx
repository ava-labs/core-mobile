import React from 'react'
import { Icons, View } from '@avalabs/k2-alpine'
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

  return (
    <Logo
      logoUri={logoUri}
      size={size}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
    />
  )
}
