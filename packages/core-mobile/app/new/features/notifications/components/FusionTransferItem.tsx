import React, { FC, use, useCallback, useMemo } from 'react'
import { Text } from '@avalabs/k2-alpine'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { FusionTransfer } from 'features/swapV2/types'
import { mapTransferToSwapStatus } from '../utils'
import NotificationListItem from './NotificationListItem'
import { SwapIcon } from './SwapIcon'
import { RetrySwapButton } from './RetrySwapButton'

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

  const shouldBePlural = useMemo(() => {
    return !!fromAmount?.gt(1)
  }, [fromAmount])

  const title = useMemo(() => {
    return status === 'failed'
      ? `${fromAmount?.toDisplay() ?? ''} ${fromSymbol} swapped for ${
          toAmount?.toDisplay() ?? ''
        } ${toSymbol}`
      : status === 'completed'
      ? `${fromAmount?.toDisplay() ?? ''} ${fromSymbol} ${
          shouldBePlural ? 'were' : 'was'
        } swapped for ${toAmount?.toDisplay() ?? ''} ${toSymbol}`
      : `Swapping ${fromSymbol} to ${toSymbol} in progress...`
  }, [fromAmount, fromSymbol, shouldBePlural, toAmount, toSymbol, status])

  const subtitle =
    status === 'completed'
      ? 'Completed'
      : status === 'failed'
      ? 'Failed'
      : 'Tap for more details'

  const accessoryType =
    status === 'completed' || status === 'failed' ? 'none' : 'chevron'

  const renderSubtitle = useCallback(() => {
    return (
      <Text
        variant="body2"
        sx={{
          lineHeight: 22,
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
      timestamp={status === 'failed' ? undefined : item.timestamp}
      showSeparator={showSeparator}
      accessoryType={accessoryType}
      testID={testID}
      rightAccessory={<RetrySwapButton status={status} item={item} />}
    />
  )
}
