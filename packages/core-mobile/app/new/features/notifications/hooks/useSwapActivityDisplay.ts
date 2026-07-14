import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceForAccount } from 'features/portfolio/hooks/useTokensWithBalanceForAccount'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useFormatCurrency } from 'new/common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { getRecoveredAtomicAmount, type Transfer } from '@avalabs/fusion-sdk'
import { getNetworkLongDisplayName } from 'common/utils/getNetworkDisplayName'
import { FusionTransfer } from 'features/swap/types'
import { NotificationSwapStatus } from '../types'
import {
  mapTransferToSourceChainStatus,
  mapTransferToSwapStatus,
  mapTransferToTargetChainStatus
} from '../utils'

function buildRefundNote(
  transfer: Transfer,
  getNetworkByCaip2ChainId: (
    chainId: string
  ) => { chainName: string } | undefined
): string | undefined {
  if (!('refund' in transfer) || !transfer.refund?.asset) return undefined
  const { refund } = transfer
  const { asset } = refund
  if (!asset) return undefined
  const refundTokenUnit = new TokenUnit(
    refund.amount,
    asset.decimals,
    asset.symbol
  )
  const plurality = refundTokenUnit.gt(1) ? 'were' : 'was'
  const chainName =
    getNetworkByCaip2ChainId(refund.chainId)?.chainName ??
    transfer.targetChain.chainName
  return `${refundTokenUnit.toDisplay()} ${
    asset.symbol
  } ${plurality} refunded to your wallet on ${chainName}`
}

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
  fromNetworkChainId?: number
  toNetworkChainId?: number
  fromTokenLogoUri?: string
  toTokenLogoUri?: string
  /** Overall swap status (completed only when both chains are done). */
  status: NotificationSwapStatus
  /** Status for the source (From) chain leg only. */
  fromChainStatus: NotificationSwapStatus
  /** Status for the target (To) chain leg only. */
  toChainStatus: NotificationSwapStatus
  txHash?: string
  /** Refund note shown on the target card when the swap was partially refunded. */
  refundNote?: string
  /** Error reason shown on failed swaps. */
  errorReason?: string
  /** Confirmation progress for the source (From) chain leg. */
  fromConfirmations?: { count: number; required: number }
  /** Confirmation progress for the target (To) chain leg. */
  toConfirmations?: { count: number; required: number }
  /**
   * True when part of the imported amount was AVAX recovered from a previous
   * incomplete cross-chain transfer (SDK `getRecoveredAtomicAmount` > 0n). Drives an
   * informational note explaining why the received amount exceeds what was sent.
   */
  includesRecoveredFunds: boolean
}

/**
 * Derives all display-level data for a swap activity from its raw stored shape.
 *
 * - Token logos are resolved from metadata stored at swap time (always available,
 *   even if the token is no longer held).
 * - Network logos are resolved from the Redux networks store.
 * - USD values are computed from the on-chain amount × token price.
 * - Returns undefined when item is undefined (swap not found).
 *
 * All internal hooks are always called (no conditional hook calls), so this
 * is safe to use unconditionally even when the item may not yet be available.
 */
export function useSwapActivityDisplay(
  item?: FusionTransfer
): SwapActivityDisplay | undefined {
  const activeAccount = useSelector(selectActiveAccount)
  const { getNetworkByCaip2ChainId } = useNetworks()
  const { formatTokenInCurrency } = useFormatCurrency()

  // Balance data is already fetched by the portfolio screen; this just reads
  // from the React Query cache without issuing a new network request.
  const tokens = useTokensWithBalanceForAccount({ account: activeAccount })

  const fromTokenData = useMemo(
    () =>
      item
        ? tokens.find(
            t =>
              t.internalId === item.fromToken.internalId ||
              t.localId === item.fromToken.localId
          )
        : undefined,
    [tokens, item]
  )

  const toTokenData = useMemo(
    () =>
      item
        ? tokens.find(
            t =>
              t.internalId === item.toToken.internalId ||
              t.localId === item.toToken.localId
          )
        : undefined,
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
      amount: fromTokenUnit.mul(price).toDisplay({ asNumber: true }),
      showLessThanThreshold: true
    })
  }, [fromTokenUnit, fromTokenData, formatTokenInCurrency])

  const toAmountInCurrency = useMemo(() => {
    const price = (toTokenData as { priceInCurrency?: number } | undefined)
      ?.priceInCurrency
    if (!price || !toTokenUnit) return undefined
    return formatTokenInCurrency({
      amount: toTokenUnit.mul(price).toDisplay({ asNumber: true }),
      showLessThanThreshold: true
    })
  }, [toTokenUnit, toTokenData, formatTokenInCurrency])

  return useMemo(() => {
    if (!item) return undefined

    const { transfer } = item
    const sourceChainId = getChainIdFromCaip2(transfer.sourceChain.chainId)
    const targetChainId = getChainIdFromCaip2(transfer.targetChain.chainId)
    const fromNetworkData =
      sourceChainId !== undefined
        ? getNetworkByCaip2ChainId(transfer.sourceChain.chainId)
        : undefined
    const toNetworkData =
      targetChainId !== undefined
        ? getNetworkByCaip2ChainId(transfer.targetChain.chainId)
        : undefined

    const refundNote =
      mapTransferToSwapStatus(transfer) === NotificationSwapStatus.Refunded
        ? buildRefundNote(transfer, getNetworkByCaip2ChainId)
        : undefined

    return {
      fromToken: transfer.sourceAsset.symbol,
      toToken: transfer.targetAsset.symbol,
      fromAmount,
      toAmount,
      fromAmountInCurrency,
      toAmountInCurrency,
      fromNetwork: fromNetworkData
        ? getNetworkLongDisplayName(fromNetworkData)
        : transfer.sourceChain.chainName,
      toNetwork: toNetworkData
        ? getNetworkLongDisplayName(toNetworkData)
        : transfer.targetChain.chainName,
      fromNetworkLogoUri: fromNetworkData?.logoUri,
      toNetworkLogoUri: toNetworkData?.logoUri,
      fromNetworkChainId: fromNetworkData?.chainId,
      toNetworkChainId: toNetworkData?.chainId,
      fromTokenLogoUri: item.fromToken.logoUri,
      toTokenLogoUri: item.toToken.logoUri,
      status: mapTransferToSwapStatus(transfer),
      fromChainStatus: mapTransferToSourceChainStatus(transfer),
      toChainStatus: mapTransferToTargetChainStatus(transfer),
      txHash: transfer.source?.txHash,
      refundNote,
      errorReason: 'errorReason' in transfer ? transfer.errorReason : undefined,
      fromConfirmations:
        'source' in transfer && transfer.source !== undefined
          ? {
              count: transfer.source.confirmationCount,
              required: transfer.source.requiredConfirmationCount
            }
          : undefined,
      toConfirmations:
        'target' in transfer && transfer.target != null
          ? {
              count: transfer.target.confirmationCount,
              required: transfer.target.requiredConfirmationCount
            }
          : undefined,
      includesRecoveredFunds: (getRecoveredAtomicAmount(transfer) ?? 0n) > 0n
    }
  }, [
    item,
    getNetworkByCaip2ChainId,
    fromAmount,
    toAmount,
    fromAmountInCurrency,
    toAmountInCurrency
  ])
}
