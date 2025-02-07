import React from 'react'
import { alpha, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { TokenType } from '@avalabs/vm-module-types'
import { AVAX_P_ID, AVAX_X_ID, LocalTokenWithBalance } from 'store/balance'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { TokenLogo } from '../TokenLogo'

interface Props {
  token: LocalTokenWithBalance
}

export const AssetLogoWithNetwork = ({ token }: Props): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)

  const renderNetworkLogo = (
    t: LocalTokenWithBalance
  ): React.JSX.Element | undefined => {
    if (
      t.type === TokenType.ERC20 ||
      t.localId === AVAX_P_ID ||
      t.localId === AVAX_X_ID
    ) {
      const renderLogo = (): React.JSX.Element => {
        if (t.localId === AVAX_P_ID) {
          return <Icons.Logos.AvaxP width={12} height={12} />
        }
        if (t.localId === AVAX_X_ID) {
          return <Icons.Logos.AvaxX width={12} height={12} />
        }
        if ('chainId' in t && t.chainId && isAvalancheChainId(t.chainId)) {
          return <Icons.Logos.Avax width={12} height={12} />
        }
        return <Icons.Logos.Eth width={12} height={12} />
      }

      return (
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 16 / 2,
            position: 'absolute',
            bottom: -2,
            right: -2,
            borderColor: colors.$surfacePrimary,
            borderWidth: 2,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}
          testID="network_logo">
          {renderLogo()}
        </View>
      )
    }
    return undefined
  }

  return (
    <View style={{ marginRight: 16 }}>
      <TokenLogo
        size={36}
        symbol={token.symbol}
        logoUri={token.logoUri}
        backgroundColor={colors.$borderPrimary}
        borderColor={borderColor}
      />
      {renderNetworkLogo(token)}
    </View>
  )
}
