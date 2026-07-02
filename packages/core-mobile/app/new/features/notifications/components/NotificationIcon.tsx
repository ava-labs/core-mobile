import React, { FC } from 'react'
import { Icons, Logos, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { NetworkBadge } from 'common/components/NetworkBadge'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useNetworks } from 'hooks/networks/useNetworks'
import {
  AppNotification,
  isPriceAlertNotification,
  isBalanceChangeNotification,
  isRecurringSwapNotification,
  BalanceChangeEventSchema
} from '../types'

const ICON_SIZE = 36

type NotificationIconProps = {
  notification: AppNotification
}

const NotificationIcon: FC<NotificationIconProps> = ({ notification }) => {
  const {
    theme: { colors }
  } = useTheme()
  const { getMarketTokenById } = useWatchlist()
  const { getNetwork } = useNetworks()

  // Resolve market token once for price alerts
  const priceAlertTokenId = isPriceAlertNotification(notification)
    ? notification.data?.tokenId
    : undefined
  const priceAlertTokenSymbol = isPriceAlertNotification(notification)
    ? notification.data?.tokenSymbol
    : undefined
  const marketToken = priceAlertTokenId
    ? getMarketTokenById(priceAlertTokenId)
    : undefined
  const shouldRenderTokenLogo = Boolean(priceAlertTokenSymbol || marketToken)

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
    if (isBalanceChangeNotification(notification)) {
      return renderBalanceChangeIcon()
    }
    if (isRecurringSwapNotification(notification)) {
      // The schedules screen uses the same `Compare` glyph for the
      // (tokenIn → tokenOut) header on each card — reusing it here keeps
      // the visual link consistent when the user taps through.
      return <Icons.Custom.Compare color={colors.$textPrimary} />
    }
    return (
      <Logos.AppIcons.Core color={colors.$textPrimary} width={24} height={7} />
    )
  }

  // Chain badge for balance-change + recurring-swap rows. Both carry an
  // EVM chainId in metadata (recurring-swap's already a number from the
  // schema coercion, balance-change's a string — `Number(chainId)`
  // normalises either). News / PriceAlerts have no chain context.
  const renderChainBadge = (): React.JSX.Element | null => {
    const chainId =
      isBalanceChangeNotification(notification) ||
      isRecurringSwapNotification(notification)
        ? notification.data?.chainId
        : undefined
    if (chainId === undefined || chainId === '') return null

    const network = getNetwork(Number(chainId))
    if (!network) return null

    return (
      <NetworkBadge
        logoUri={network.logoUri}
        borderColor={colors.$surfacePrimary}
      />
    )
  }

  // For price alerts with token data, render TokenLogo directly (without circular wrapper)
  if (shouldRenderTokenLogo) {
    return (
      <TokenLogo
        symbol={priceAlertTokenSymbol ?? marketToken?.symbol ?? ''}
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
