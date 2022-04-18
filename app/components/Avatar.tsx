import React, { FC, useCallback } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Erc20Token } from '@avalabs/avalanche-wallet-sdk/dist/Asset'
import { TokenWithBalance } from '@avalabs/wallet-react-components'
import { Opacity10 } from 'resources/Constants'
import EthereumSvg from 'components/svg/Ethereum'
import BitcoinSVG from 'components/svg/BitcoinSVG'
import AvaText from './AvaText'

interface Props {
  name: string
  symbol?: string
  logoUri?: string
  showBorder?: boolean
  size?: number
  circleColor?: string
}

function isTokenWithBalance(
  token: Erc20Token | TokenWithBalance
): token is TokenWithBalance {
  return 'logoURI' in token
}

const AvatarBase: FC<Props> = ({
  name,
  symbol,
  logoUri,
  showBorder,
  size = 32,
  circleColor
}) => {
  const { theme, isDarkMode } = useApplicationContext()
  const hasValidLogoUri =
    !!logoUri && (logoUri.startsWith('http') || logoUri.startsWith('https'))

  const tokenLogo = useCallback(() => {
    // if AVAX, return our own logo
    if (symbol === 'AVAX' || symbol === 'FAU') {
      return (
        <AvaLogoSVG
          size={size}
          logoColor={theme.tokenLogoColor}
          backgroundColor={theme.tokenLogoBg}
        />
      )
    } else if (symbol === 'ETH') {
      return <EthereumSvg size={size} />
    } else if (symbol === 'BTC') {
      return <BitcoinSVG size={size} />
    }

    // if ERC20 or invalid URL, return token initials
    if (!hasValidLogoUri) {
      const names = (name ?? '').split(' ')
      const initials =
        names.length > 1
          ? names[0].substring(0, 1) + names[names.length - 1].substring(0, 1)
          : names[0].substring(0, 1)

      return (
        <View
          style={[
            styles.initials,
            {
              backgroundColor: circleColor
                ? circleColor
                : theme.colorStroke2 + Opacity10,
              width: size,
              height: size
            },
            showBorder && { borderWidth: 0.5, borderColor: theme.colorDisabled }
          ]}>
          <AvaText.Body1>{initials}</AvaText.Body1>
        </View>
      )
      // if TokenWithBalance and valid URI get load it.
    } else {
      return (
        <Image
          style={styles.tokenLogo}
          source={{ uri: logoUri! }}
          width={size}
          height={size}
        />
      )
    }
  }, [hasValidLogoUri, isDarkMode, logoUri, name, showBorder, size, symbol])

  return tokenLogo()
}

interface TokenAvatarProps {
  token: Erc20Token | TokenWithBalance
  size?: number
}

const TokenAvatar: FC<TokenAvatarProps> = ({ token, size }) => {
  const isErc20Token = !isTokenWithBalance(token)
  const name = token.name
  const symbol = token.symbol
  const logoUri = isErc20Token ? undefined : (token as TokenWithBalance).logoURI

  return (
    <AvatarBase name={name} symbol={symbol} logoUri={logoUri} size={size} />
  )
}

const CustomAvatar: FC<Props> = props => {
  return <AvatarBase {...props} />
}

const Avatar = {
  Token: TokenAvatar,
  Custom: CustomAvatar
}

const styles = StyleSheet.create({
  tokenLogo: {
    paddingHorizontal: 16,
    borderRadius: 50,
    overflow: 'hidden'
  },
  initials: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default Avatar
