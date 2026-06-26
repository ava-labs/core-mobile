import React, { FC, useCallback, useMemo } from 'react'
import { Text } from '@avalabs/k2-alpine'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { FusionTransfer } from 'features/swap/types'
import { getNetworkDisplayName } from 'common/utils/getNetworkDisplayName'
import { mapTransferToSwapStatus } from '../utils'
import { NotificationSwapStatus } from '../types'
import NotificationListItem from './NotificationListItem'
import { SwapIcon } from './SwapIcon'

const SUBTITLE_MAP = {
  [NotificationSwapStatus.Completed]: 'Completed',
  [NotificationSwapStatus.Failed]: 'Failed',
  [NotificationSwapStatus.Refunded]: undefined
} as const

type FusionTransferItemProps = {
  item: FusionTransfer
  showSeparator: boolean
  testID?: string
}

/**
 * List item for a fusion transfer transaction in the notification center.
 *
 * Title is derived from the item's fromToken / toToken amounts and symbols
 */
export const FusionTransferItem: FC<FusionTransferItemProps> = ({
  item,
  showSeparator,
  testID
}) => {
  const { getNetworkByCaip2ChainId } = useNetworks()

  const status = mapTransferToSwapStatus(item.transfer)
  const fromSymbol = item.transfer.sourceAsset.symbol
  const toSymbol = item.transfer.targetAsset.symbol

  const fromNetwork = getNetworkByCaip2ChainId(
    item.transfer.sourceChain.chainId
  )
  const toNetwork = getNetworkByCaip2ChainId(item.transfer.targetChain.chainId)
  const fromNetworkLogoUri = fromNetwork?.logoUri
  const fromNetworkChainId = fromNetwork?.chainId
  // Only annotate the title with chain names when the route actually
  // crosses chains — same-chain swaps (Markr / Wrap-Unwrap) keep the
  // tighter `0.1 USDC swapped for 0.1 USDT` form.
  const isCrossChain =
    item.transfer.sourceChain.chainId !== item.transfer.targetChain.chainId
  const fromChainName =
    isCrossChain && fromNetwork ? getNetworkDisplayName(fromNetwork) : undefined
  const toChainName =
    isCrossChain && toNetwork ? getNetworkDisplayName(toNetwork) : undefined

  const fromAmount = useMemo(() => {
    try {
      return new TokenUnit(
        BigInt(item.transfer.amountIn),
        item.transfer.sourceAsset.decimals,
        item.transfer.sourceAsset.symbol
      )
    } catch {
      return undefined
    }
  }, [item.transfer])

  const toAmount = useMemo(() => {
    try {
      return new TokenUnit(
        BigInt(item.transfer.amountOut),
        item.transfer.targetAsset.decimals,
        item.transfer.targetAsset.symbol
      )
    } catch {
      return undefined
    }
  }, [item.transfer])

  const title = useMemo(() => {
    if (
      status === NotificationSwapStatus.Refunded &&
      'refund' in item.transfer
    ) {
      const { refund } = item.transfer
      if (refund.asset) {
        const refundUnit = new TokenUnit(
          refund.amount,
          refund.asset.decimals,
          refund.asset.symbol
        )
        return `${refundUnit.toDisplay()} ${
          refund.asset.symbol
        } refunded to your wallet`
      }
    }
    const fromBase = fromAmount
      ? `${fromAmount.toDisplay()} ${fromSymbol}`
      : fromSymbol
    const toBase = toAmount ? `${toAmount.toDisplay()} ${toSymbol}` : toSymbol
    const from = fromChainName ? `${fromBase} (${fromChainName})` : fromBase
    const to = toChainName ? `${toBase} (${toChainName})` : toBase
    return status === NotificationSwapStatus.InProgress
      ? `Swapping ${fromSymbol} to ${toSymbol} in progress...`
      : `${from} swapped for ${to}`
  }, [
    fromAmount,
    fromSymbol,
    toAmount,
    toSymbol,
    status,
    item.transfer,
    fromChainName,
    toChainName
  ])

  const subtitle =
    status in SUBTITLE_MAP
      ? SUBTITLE_MAP[status as keyof typeof SUBTITLE_MAP]
      : 'Tap for more details'

  const accessoryType = 'chevron'

  const renderSubtitle = useCallback(() => {
    if (!subtitle) return null
    return (
      <Text
        variant="body2"
        sx={{
          lineHeight: 15,
          fontFamily: 'Inter-SemiBold',
          color:
            status === NotificationSwapStatus.Completed
              ? '$textSuccess'
              : status === NotificationSwapStatus.Failed
              ? '$textDanger'
              : '$textSecondary'
        }}
        numberOfLines={1}
        ellipsizeMode="tail">
        {subtitle}
      </Text>
    )
  }, [status, subtitle])

  return (
    <NotificationListItem
      title={title}
      subtitle={renderSubtitle()}
      icon={
        <SwapIcon
          status={status}
          networkLogoUri={fromNetworkLogoUri}
          networkChainId={fromNetworkChainId}
        />
      }
      timestamp={item.timestamp}
      showSeparator={showSeparator}
      accessoryType={accessoryType}
      testID={testID}
    />
  )
}
