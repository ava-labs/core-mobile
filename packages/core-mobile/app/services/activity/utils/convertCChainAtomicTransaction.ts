import {
  TokenType,
  Transaction as InternalTransaction
} from '@avalabs/vm-module-types'
import {
  CChainExportTransaction,
  CChainImportTransaction,
  PChainTransactionType
} from '@avalabs/glacier-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Transaction } from 'store/transaction'

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

export const convertCChainAtomicTransaction = (
  tx: CChainImportTransaction | CChainExportTransaction,
  network: { chainId: number; explorerUrl?: string }
): Transaction => {
  const exported = isExport(tx)
  const legs = exported ? tx.evmInputs : tx.evmOutputs
  const primaryAsset = legs[0]?.asset
  const userAddress = exported
    ? (legs[0] as CChainExportTransaction['evmInputs'][number] | undefined)
        ?.fromAddress
    : (legs[0] as CChainImportTransaction['evmOutputs'][number] | undefined)
        ?.toAddress

  const totalRaw = legs
    .filter(l => l.asset?.assetId === primaryAsset?.assetId)
    .reduce((sum, l) => sum + BigInt(l.asset.amount), 0n)

  const amount = primaryAsset
    ? formatAtomicAmount(
        totalRaw.toString(),
        primaryAsset.denomination,
        primaryAsset.symbol
      )
    : '0'

  const token = {
    type: TokenType.NATIVE as const,
    name: primaryAsset?.name ?? 'Avalanche',
    symbol: primaryAsset?.symbol ?? 'AVAX',
    decimal: primaryAsset ? String(primaryAsset.denomination) : undefined,
    amount,
    ...(exported
      ? { from: { address: userAddress ?? '' } }
      : { to: { address: userAddress ?? '' } })
  }

  const txType = exported
    ? PChainTransactionType.EXPORT_TX
    : PChainTransactionType.IMPORT_TX

  const result: Omit<InternalTransaction, 'txType'> & {
    txType: PChainTransactionType
  } = {
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
    from: exported ? userAddress ?? '' : '',
    to: exported ? '' : userAddress ?? '',
    tokens: [token],
    gasUsed: '0',
    chainId: String(network.chainId),
    explorerLink: network.explorerUrl
      ? `${network.explorerUrl}/tx/${tx.txHash}`
      : '',
    txType
  }

  return result as Transaction
}
