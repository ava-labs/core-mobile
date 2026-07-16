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
): tx is CChainExportTransaction => tx.txType === 'ExportTx'

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
  const leg = exported ? tx.evmInputs[0] : tx.evmOutputs[0]
  const asset = leg?.asset
  const userAddress = exported
    ? (leg as CChainExportTransaction['evmInputs'][number] | undefined)
        ?.fromAddress
    : (leg as CChainImportTransaction['evmOutputs'][number] | undefined)
        ?.toAddress

  const amount = asset
    ? formatAtomicAmount(asset.amount, asset.denomination, asset.symbol)
    : '0'

  const token = {
    type: TokenType.NATIVE as const,
    name: asset?.name ?? 'Avalanche',
    symbol: asset?.symbol ?? 'AVAX',
    decimal: asset ? String(asset.denomination) : undefined,
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
    timestamp: tx.timestamp,
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
