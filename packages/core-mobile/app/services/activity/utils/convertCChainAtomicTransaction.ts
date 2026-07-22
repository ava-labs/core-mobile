import { TokenType } from '@avalabs/vm-module-types'
import {
  AssetAmount,
  CChainExportTransaction,
  CChainImportTransaction,
  PChainTransactionType
} from '@avalabs/glacier-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import type { Transaction } from 'store/transaction/types'

const isExport = (
  tx: CChainImportTransaction | CChainExportTransaction
): tx is CChainExportTransaction =>
  tx.txType === CChainExportTransaction.txType.EXPORT_TX

const formatAtomicAmount = (
  rawAmount: string,
  denomination: number,
  symbol: string
): string =>
  new TokenUnit(BigInt(rawAmount), denomination, symbol)
    .toDisplay()
    .replaceAll(',', '')

/**
 * Display the amount *created* by the tx outputs (`amountCreated`), not the
 * consumed inputs: for an export, summing `evmInputs` would include the atomic
 * export fee and overstate "X AVAX exported" versus what actually arrives on
 * the destination chain. This mirrors the X/P activity rows, which render the
 * emitted/created amount (net of fee), keeping C-Chain atomic rows consistent.
 */
const resolveDisplayAmount = (
  tx: CChainImportTransaction | CChainExportTransaction,
  primaryAsset: AssetAmount | undefined
): string => {
  if (!primaryAsset) return '0'

  const totalRaw = (tx.amountCreated ?? [])
    .filter(asset => asset.assetId === primaryAsset.assetId)
    .reduce((sum, asset) => sum + BigInt(asset.amount), 0n)

  return formatAtomicAmount(
    totalRaw.toString(),
    primaryAsset.denomination,
    primaryAsset.symbol
  )
}

export const convertCChainAtomicTransaction = (
  tx: CChainImportTransaction | CChainExportTransaction,
  network: { chainId: number; explorerUrl?: string }
): Transaction | null => {
  const exported = isExport(tx)
  const legs = exported ? tx.evmInputs : tx.evmOutputs

  // A well-formed atomic tx always has at least one EVM leg (the C-Chain side
  // of the transfer). Guard against an empty array so we never emit a phantom
  // "0 AVAX imported/exported" row with no address — the caller drops nulls.
  if (legs.length === 0) return null

  // v1 assumption: these rows are AVAX-only. The primary asset (symbol,
  // denomination, and the assetId used to select which created legs to sum) is
  // taken from the first EVM leg. A multi-asset atomic tx (a rare, historical
  // ANT movement) would be summed/labelled by whichever asset happens to be first.
  const primaryAsset = legs[0]?.asset
  const userAddress = exported
    ? (legs[0] as CChainExportTransaction['evmInputs'][number] | undefined)
        ?.fromAddress
    : (legs[0] as CChainImportTransaction['evmOutputs'][number] | undefined)
        ?.toAddress
  const address = userAddress ?? ''

  const token = {
    type: TokenType.NATIVE as const,
    name: primaryAsset?.name ?? 'Avalanche',
    symbol: primaryAsset?.symbol ?? 'AVAX',
    decimal: primaryAsset ? String(primaryAsset.denomination) : undefined,
    amount: resolveDisplayAmount(tx, primaryAsset),
    ...(exported ? { from: { address } } : { to: { address } })
  }

  return {
    isContractCall: false,
    isIncoming: !exported,
    isOutgoing: exported,
    isSender: exported,
    // Glacier returns atomic-tx timestamps in seconds; the internal Transaction
    // timestamp is milliseconds (the EVM module emits blockTimestamp*1000, and
    // activity date-grouping does `new Date(tx.timestamp)`). Normalize to ms so
    // atomic rows interleave/sort correctly with EVM txs.
    timestamp: tx.timestamp * 1000,
    hash: tx.txHash,
    from: exported ? address : '',
    to: exported ? '' : address,
    tokens: [token],
    gasUsed: '0',
    chainId: String(network.chainId),
    explorerLink: network.explorerUrl
      ? `${network.explorerUrl}/tx/${tx.txHash}`
      : '',
    txType: exported
      ? PChainTransactionType.EXPORT_TX
      : PChainTransactionType.IMPORT_TX
  }
}
