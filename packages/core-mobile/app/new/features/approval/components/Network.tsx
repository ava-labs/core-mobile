import React from 'react'
import { View, Text, alpha, useTheme } from '@avalabs/k2-alpine'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import { TokenLogo } from 'new/common/components/TokenLogo'
import { NetworkLogo } from 'new/common/components/NetworkLogo'

export const Network = ({
  logoUri,
  symbol,
  name,
  chainId
}: {
  logoUri: string | undefined
  symbol?: string
  name: string
  chainId?: number
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  return (
    <View
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        paddingVertical: 12
      }}>
      <Text
        variant="body1"
        sx={{ fontSize: 16, lineHeight: 22, color: '$textPrimary' }}>
        Network
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          maxWidth: '60%',
          flex: 1,
          justifyContent: 'flex-end'
        }}>
        {chainId !== undefined && (isPChain(chainId) || isXChain(chainId)) ? (
          <NetworkLogo logoUri={logoUri} chainId={chainId} size={24} />
        ) : (
          <TokenLogo logoUri={logoUri} symbol={symbol} size={24} />
        )}

        <Text
          testID={`network__${name}`}
          variant="body1"
          numberOfLines={1}
          sx={{
            fontSize: 16,
            lineHeight: 22,
            color: alpha(colors.$textPrimary, 0.6)
          }}>
          {name}
        </Text>
      </View>
    </View>
  )
}
