import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { SwapActivityItem, SwapStatus } from '../types'
import {
  mapTransferToSourceChainStatus,
  mapTransferToSwapStatus,
  mapTransferToTargetChainStatus
} from '../utils'

export type SwapActivityDisplay = {
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  fromAmountInCurrency?: string
  toAmountInCurrency?: string
  fromNetwork: string
  toNetwork: string
  fromNetworkLogoUri?: string
  toNetworkLogoUri?: string
  fromTokenLogoUri?: string
  toTokenLogoUri?: string
  /** Overall swap status (completed only when both chains are done). */
  status: SwapStatus
  /** Status for the source (From) chain leg only. */
  fromChainStatus: SwapStatus
  /** Status for the target (To) chain leg only. */
  toChainStatus: SwapStatus
  txHash?: string
}

/**
 * Parses a CAIP-2 chain ID (e.g. "eip155:43114") into a numeric chain ID.
 * Returns undefined if the format is unexpected.
 */
function parseCAIP2ChainId(caip2: string): number | undefined {
  const id = parseInt(caip2.split(':')[1] ?? '', 10)
  return isNaN(id) ? undefined : id
}

/**
 * Derives all display-level data for a swap activity from its raw stored shape.
 *
 * - Token logos are resolved from the active account's in-memory balance data.
 * - Network logos are resolved from the Redux networks store.
 * - USD values are computed from the on-chain amount × token price.
 * - Returns undefined when item is undefined (swap not found).
 *
 * All internal hooks are always called (no conditional hook calls), so this
 * is safe to use unconditionally even when the item may not yet be available.
 */
export function useSwapActivityDisplay(
  item?: SwapActivityItem
): SwapActivityDisplay | undefined {
  const activeAccount = useSelector(selectActiveAccount)
  const { getNetworkByCaip2ChainId } = useNetworks()
  const { formatTokenInCurrency } = useFormatCurrency()

  // Balance data is already fetched by the portfolio screen; this just reads
  // from the React Query cache without issuing a new network request.
  const tokens = useTokensWithBalanceForAccount({ account: activeAccount })

  const fromTokenData = useMemo(
    () => (item ? tokens.find(t => t.localId === item.fromTokenId) : undefined),
    [tokens, item]
  )

  const toTokenData = useMemo(
    () => (item ? tokens.find(t => t.localId === item.toTokenId) : undefined),
    [tokens, item]
  )

  const fromTokenUnit = useMemo(() => {
    if (!item) return undefined
    try {
      return new TokenUnit(
        BigInt(item.transfer.amountIn),
        item.transfer.sourceAsset.decimals,
        item.transfer.sourceAsset.symbol
      )
    } catch {
      return undefined
    }
  }, [item])

  const toTokenUnit = useMemo(() => {
    if (!item) return undefined
    try {
      return new TokenUnit(
        BigInt(item.transfer.amountOut),
        item.transfer.targetAsset.decimals,
        item.transfer.targetAsset.symbol
      )
    } catch {
      return undefined
    }
  }, [item])

  const fromAmount = useMemo(
    () => fromTokenUnit?.toDisplay() ?? UNKNOWN_AMOUNT,
    [fromTokenUnit]
  )

  const toAmount = useMemo(
    () => toTokenUnit?.toDisplay() ?? UNKNOWN_AMOUNT,
    [toTokenUnit]
  )

  const fromAmountInCurrency = useMemo(() => {
    const price = (fromTokenData as { priceInCurrency?: number } | undefined)
      ?.priceInCurrency
    if (!price || !fromTokenUnit) return undefined
    return formatTokenInCurrency({
      amount: fromTokenUnit.mul(price).toDisplay({ asNumber: true })
    })
  }, [fromTokenUnit, fromTokenData, formatTokenInCurrency])

  const toAmountInCurrency = useMemo(() => {
    const price = (toTokenData as { priceInCurrency?: number } | undefined)
      ?.priceInCurrency
    if (!price || !toTokenUnit) return undefined
    return formatTokenInCurrency({
      amount: toTokenUnit.mul(price).toDisplay({ asNumber: true })
    })
  }, [toTokenUnit, toTokenData, formatTokenInCurrency])

  return useMemo(() => {
    if (!item) return undefined

    const { transfer } = item
    const sourceChainId = parseCAIP2ChainId(transfer.sourceChain.chainId)
    const targetChainId = parseCAIP2ChainId(transfer.targetChain.chainId)
    const fromNetworkData =
      sourceChainId !== undefined
        ? getNetworkByCaip2ChainId(transfer.sourceChain.chainId)
        : undefined
    const toNetworkData =
      targetChainId !== undefined
        ? getNetworkByCaip2ChainId(transfer.targetChain.chainId)
        : undefined

    return {
      fromToken: transfer.sourceAsset.symbol,
      toToken: transfer.targetAsset.symbol,
      fromAmount,
      toAmount,
      fromAmountInCurrency,
      toAmountInCurrency,
      fromNetwork: transfer.sourceChain.chainName,
      toNetwork: transfer.targetChain.chainName,
      fromNetworkLogoUri: fromNetworkData?.logoUri,
      toNetworkLogoUri: toNetworkData?.logoUri,
      fromTokenLogoUri: (fromTokenData as { logoUri?: string } | undefined)
        ?.logoUri,
      toTokenLogoUri: (toTokenData as { logoUri?: string } | undefined)
        ?.logoUri,
      status: mapTransferToSwapStatus(transfer),
      fromChainStatus: mapTransferToSourceChainStatus(transfer),
      toChainStatus: mapTransferToTargetChainStatus(transfer),
      txHash: transfer.source?.txHash
    }
  }, [
    item,
    getNetworkByCaip2ChainId,
    fromAmount,
    toAmount,
    fromAmountInCurrency,
    toAmountInCurrency,
    fromTokenData,
    toTokenData
  ])
}
