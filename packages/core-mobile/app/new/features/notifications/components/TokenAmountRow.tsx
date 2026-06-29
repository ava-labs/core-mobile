import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { NetworkLogo } from 'common/components/NetworkLogo'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import React from 'react'

const TOKEN_LOGO_SIZE = 40
const NETWORK_BADGE_SIZE = 14
const NETWORK_BADGE_BORDER = 2

type TokenAmountRowProps = {
  symbol: string
  logoUri?: string
  networkLogoUri?: string
  networkChainId?: number
  amount?: string
  amountInCurrency?: string
  isDebit: boolean
}

export const TokenAmountRow = ({
  symbol,
  logoUri,
  networkLogoUri,
  networkChainId,
  amount,
  amountInCurrency,
  isDebit
}: TokenAmountRowProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const badgeContainerSize = NETWORK_BADGE_SIZE + NETWORK_BADGE_BORDER * 2
  // Only show the chain badge for P-Chain or X-Chain native AVAX — those are
  // the cases where the badge meaningfully differentiates from the parent
  // AVAX logo. For C-Chain (or non-Avalanche networks, or any non-AVAX
  // asset that might land on P/X surfaces in the future) the badge would
  // either duplicate the main token logo or claim AVAX-iness it doesn't have.
  const showChainBadge =
    symbol === 'AVAX' &&
    networkChainId !== undefined &&
    (isPChain(networkChainId) || isXChain(networkChainId))

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4
      }}>
      <View style={{ width: TOKEN_LOGO_SIZE }}>
        <TokenLogo symbol={symbol} logoUri={logoUri} size={TOKEN_LOGO_SIZE} />
        {showChainBadge && (
          <View
            style={{
              width: badgeContainerSize,
              height: badgeContainerSize,
              borderRadius: badgeContainerSize / 2,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: NETWORK_BADGE_BORDER,
              borderColor: colors.$surfaceSecondary,
              position: 'absolute',
              bottom: -4,
              right: -4,
              backgroundColor: 'transparent'
            }}>
            <NetworkLogo
              logoUri={networkLogoUri}
              chainId={networkChainId}
              size={NETWORK_BADGE_SIZE}
              chainBadgeBorderColor={colors.$surfaceSecondary}
              asBadge
            />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="buttonMedium" sx={{ color: '$textPrimary' }}>
          {symbol}
        </Text>
      </View>
      {amount !== undefined && (
        <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
          {isNaN(Number(amount)) ? (
            <Text
              numberOfLines={1}
              variant="heading2"
              sx={{
                fontWeight: '500',
                color: isDebit ? colors.$textDanger : colors.$textPrimary
              }}>
              {isDebit ? `-${amount}` : amount}
            </Text>
          ) : (
            <SubTextNumber
              number={isDebit ? `-${amount}` : amount}
              textVariant="heading2"
              fontFamily="Inter-Medium"
              textColor={isDebit ? colors.$textDanger : colors.$textPrimary}
              style={{ maxWidth: '100%' }}
            />
          )}
          {amountInCurrency !== undefined && (
            <Text
              numberOfLines={1}
              variant="body2"
              sx={{
                color: isDebit ? colors.$textDanger : colors.$textSecondary
              }}>
              {amountInCurrency}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
