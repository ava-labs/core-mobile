import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { useNetworks } from 'hooks/networks/useNetworks'
import {
  mapTransferToSourceChainStatus,
  mapTransferToSwapStatus,
  mapTransferToTargetChainStatus,
  SwapActivityItem,
  SwapStatus
} from '../types'

export type SwapActivityDisplay = {
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  fromAmountUsd?: string
  toAmountUsd?: string
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
 * Formats a raw token amount (big integer string) into a human-readable string.
 */
function formatTokenAmount(rawAmount: string, decimals: number): string {
  try {
    const value = Number(BigInt(rawAmount)) / 10 ** decimals
    if (value === 0) return '0'
    if (value >= 1000) return value.toFixed(2)
    if (value >= 1) return value.toFixed(4)
    return value.toPrecision(4)
  } catch {
    return '0'
  }
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

  const fromAmount = useMemo(() => {
    if (!item) return '0'
    return formatTokenAmount(
      item.transfer.amountIn,
      item.transfer.sourceAsset.decimals
    )
  }, [item])

  const toAmount = useMemo(() => {
    if (!item) return '0'
    return formatTokenAmount(
      item.transfer.amountOut,
      item.transfer.targetAsset.decimals
    )
  }, [item])

  const fromAmountUsd = useMemo(() => {
    const price = (fromTokenData as { priceInCurrency?: number } | undefined)
      ?.priceInCurrency
    if (!price) return undefined
    const amount = parseFloat(fromAmount)
    if (isNaN(amount)) return undefined
    return (amount * price).toFixed(2)
  }, [fromAmount, fromTokenData])

  const toAmountUsd = useMemo(() => {
    const price = (toTokenData as { priceInCurrency?: number } | undefined)
      ?.priceInCurrency
    if (!price) return undefined
    const amount = parseFloat(toAmount)
    if (isNaN(amount)) return undefined
    return (amount * price).toFixed(2)
  }, [toAmount, toTokenData])

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
      fromAmountUsd,
      toAmountUsd,
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
    fromAmountUsd,
    toAmountUsd,
    fromTokenData,
    toTokenData
  ])
}
