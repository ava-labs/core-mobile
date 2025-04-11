import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import React, { useCallback } from 'react'
import { TokenSymbol } from 'store/network'

const LOGO_SIZE = 24
const NETWORK_LOGO_SIZE = 14
const NETWORK_LOGO_SIZE_NO_BORDER = 12

export const XPChainLogo = ({
  networkType
}: {
  networkType: 'AVM' | 'PVM'
}): JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()

  const renderNetworkLogo = useCallback((): React.JSX.Element => {
    if (networkType === 'AVM') {
      return isDark ? (
        <Icons.TokenLogos.AVAX_X_DARK
          width={NETWORK_LOGO_SIZE_NO_BORDER}
          height={NETWORK_LOGO_SIZE_NO_BORDER}
        />
      ) : (
        <Icons.TokenLogos.AVAX_X_LIGHT
          width={NETWORK_LOGO_SIZE_NO_BORDER}
          height={NETWORK_LOGO_SIZE_NO_BORDER}
        />
      )
    }
    return isDark ? (
      <Icons.TokenLogos.AVAX_P_DARK
        width={NETWORK_LOGO_SIZE_NO_BORDER}
        height={NETWORK_LOGO_SIZE_NO_BORDER}
      />
    ) : (
      <Icons.TokenLogos.AVAX_P_LIGHT
        width={NETWORK_LOGO_SIZE_NO_BORDER}
        height={NETWORK_LOGO_SIZE_NO_BORDER}
      />
    )
  }, [isDark, networkType])

  return (
    <View sx={{ width: LOGO_SIZE }}>
      <TokenLogo size={LOGO_SIZE} symbol={TokenSymbol.AVAX} />
      <View
        sx={{
          width: NETWORK_LOGO_SIZE,
          height: NETWORK_LOGO_SIZE,
          borderRadius: NETWORK_LOGO_SIZE,
          position: 'absolute',
          bottom: -4,
          right: -4,
          backgroundColor: colors.$surfacePrimary,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}
        testID="network_logo">
        <View
          sx={{
            borderColor: colors.$borderPrimary,
            borderWidth: 1,
            width: NETWORK_LOGO_SIZE_NO_BORDER,
            height: NETWORK_LOGO_SIZE_NO_BORDER,
            borderRadius: NETWORK_LOGO_SIZE_NO_BORDER,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          {renderNetworkLogo()}
        </View>
      </View>
    </View>
  )
}
