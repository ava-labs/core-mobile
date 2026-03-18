import React, { FC, useCallback, useMemo } from 'react'
import { Text } from '@avalabs/k2-alpine'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { FusionTransfer } from 'features/swap/types'
import { mapTransferToSwapStatus } from '../utils'
import NotificationListItem from './NotificationListItem'
import { SwapIcon } from './SwapIcon'

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

  const fromNetworkLogoUri = getNetworkByCaip2ChainId(
    item.transfer.sourceChain.chainId
  )?.logoUri

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
    if (status === 'refunded' && 'refund' in item.transfer) {
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
    const from = fromAmount
      ? `${fromAmount.toDisplay()} ${fromSymbol}`
      : fromSymbol
    const to = toAmount ? `${toAmount.toDisplay()} ${toSymbol}` : toSymbol
    return status === 'in_progress'
      ? `Swapping ${fromSymbol} to ${toSymbol} in progress...`
      : `${from} swapped for ${to}`
  }, [fromAmount, fromSymbol, toAmount, toSymbol, status, item.transfer])

  const subtitle =
    status === 'completed'
      ? 'Completed'
      : status === 'failed'
      ? 'Failed'
      : status === 'refunded'
      ? undefined
      : 'Tap for more details'

  const accessoryType = 'chevron'

  const renderSubtitle = useCallback(() => {
    if (!subtitle) return null
    return (
      <Text
        variant="body2"
        sx={{
          lineHeight: 15,
          fontWeight: 500,
          color:
            status === 'completed'
              ? '$textSuccess'
              : status === 'failed'
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
      icon={<SwapIcon status={status} networkLogoUri={fromNetworkLogoUri} />}
      timestamp={item.timestamp}
      showSeparator={showSeparator}
      accessoryType={accessoryType}
      testID={testID}
    />
  )
}
