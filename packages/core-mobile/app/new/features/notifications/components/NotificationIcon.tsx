import React, { FC } from 'react'
import { Icons, Logos, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { NetworkLogo } from 'common/components/NetworkLogo'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useNetworks } from 'hooks/networks/useNetworks'
import {
  AppNotification,
  isPriceAlertNotification,
  isBalanceChangeNotification,
  BalanceChangeEventSchema
} from '../types'

const ICON_SIZE = 36
const CHAIN_LOGO_SIZE = 16

type NotificationIconProps = {
  notification: AppNotification
}

const NotificationIcon: FC<NotificationIconProps> = ({ notification }) => {
  const {
    theme: { colors }
  } = useTheme()
  const { getMarketTokenById } = useWatchlist()
  const { getNetwork } = useNetworks()

  // Check if we should render TokenLogo (for price alerts with token data)
  const shouldRenderTokenLogo = (): boolean => {
    if (notification.type !== 'PRICE_ALERTS') {
      return false
    }
    const tokenId = notification.data?.tokenId as string | undefined
    const tokenSymbol = notification.data?.tokenSymbol as string | undefined
    const marketToken = tokenId ? getMarketTokenById(tokenId) : undefined
    return Boolean(tokenSymbol || marketToken)
  }

  const renderBalanceChangeIcon = (): React.JSX.Element => {
    if (!isBalanceChangeNotification(notification)) {
      return <Icons.Custom.ArrowOutward color={colors.$textPrimary} />
    }
    const event = notification.data?.event

    if (
      event === BalanceChangeEventSchema.enum.BALANCES_SPENT ||
      event === BalanceChangeEventSchema.enum.BALANCES_TRANSFERRED
    ) {
      return <Icons.Custom.ArrowOutward color={colors.$textPrimary} />
    }
    if (event === BalanceChangeEventSchema.enum.ALLOWANCE_APPROVED) {
      return <Icons.Navigation.Check color={colors.$textPrimary} />
    }
    return (
      <View style={{ transform: [{ rotate: '90deg' }] }}>
        <Icons.Custom.ArrowOutward color={colors.$textPrimary} />
      </View>
    )
  }

  const renderIcon = (): React.JSX.Element => {
    switch (notification.type) {
      case 'BALANCE_CHANGES':
        return renderBalanceChangeIcon()
      case 'PRICE_ALERTS':
        return <Icons.Custom.TrendingArrowUp color={colors.$textPrimary} />
      case 'NEWS':
      default:
        return (
          <Logos.AppIcons.Core
            color={colors.$textPrimary}
            width={24}
            height={7}
          />
        )
    }
  }

  // Get chain logo for balance change notifications
  const renderChainBadge = (): React.JSX.Element | null => {
    if (!isBalanceChangeNotification(notification)) return null
    const chainId = notification.data?.chainId
    if (!chainId) return null

    const network = getNetwork(Number(chainId))
    if (!network) return null

    return (
      <View
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: CHAIN_LOGO_SIZE,
          height: CHAIN_LOGO_SIZE,
          borderRadius: CHAIN_LOGO_SIZE / 2,
          overflow: 'hidden'
        }}>
        <NetworkLogo logoUri={network.logoUri} size={CHAIN_LOGO_SIZE} />
      </View>
    )
  }

  // For price alerts with token data, render TokenLogo directly (without circular wrapper)
  if (shouldRenderTokenLogo() && isPriceAlertNotification(notification)) {
    const { tokenId, tokenSymbol } = notification.data ?? {}
    const marketToken = tokenId ? getMarketTokenById(tokenId) : undefined

    return (
      <TokenLogo
        symbol={tokenSymbol ?? marketToken?.symbol ?? ''}
        logoUri={marketToken?.logoUri}
        size={ICON_SIZE}
      />
    )
  }

  return (
    <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>
      <View
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE / 2,
          backgroundColor: '$surfaceSecondary',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        {renderIcon()}
      </View>
      {renderChainBadge()}
    </View>
  )
}

export default NotificationIcon
