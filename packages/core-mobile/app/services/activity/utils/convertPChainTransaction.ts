import { Network } from '@avalabs/chains-sdk'
import { PChainTransaction, PChainTransactionType } from '@avalabs/glacier-sdk'
import { Transaction } from 'store/transaction'
import { getExplorerAddressByNetwork } from 'utils/ExplorerUtils'
import Big from 'big.js'
import { Avalanche } from '@avalabs/wallets-sdk'
import { Avax } from 'types'
import { stripChainAddress } from 'store/account/utils'
import { isEmpty } from 'lodash'

export function convertPChainTransaction(
  tx: PChainTransaction,
  network: Network,
  address: string
): Transaction {
  const froms = new Set(tx.consumedUtxos.flatMap(utxo => utxo.addresses) || [])
  const tos = new Set(tx.emittedUtxos.flatMap(utxo => utxo.addresses) || [])

  const isImportExport = ['ImportTx', 'ExportTx'].includes(tx.txType)
  const isBaseTx = tx.txType === 'BaseTx'

  const nonChangeEmittedUtxosAmt = tx.emittedUtxos
    .filter(
      utxo =>
        utxo.asset.assetId === getAvaxAssetId(!!network.isTestnet) &&
        !utxo.addresses.some(addr => froms.has(addr))
    )
    .reduce((agg, utxo) => agg.add(utxo.asset.amount), new Big(0))
  const txValue = tx.value.find(
    val => val.assetId === getAvaxAssetId(!!network.isTestnet)
  )?.amount
  // This ternary attempts to cover the case where users send themselves AVAX
  // in which case the senders are the recipients and we should use the total tx value.
  const baseTxValue = nonChangeEmittedUtxosAmt.gt(new Big(0))
    ? nonChangeEmittedUtxosAmt
    : txValue
    ? new Big(txValue)
    : new Big(0) ?? new Big(0)

  const pBlockchainId = network.isTestnet
    ? Avalanche.FujiContext.pBlockchainID
    : Avalanche.MainnetContext.pBlockchainID

  const importExportAmount = tx.emittedUtxos
    .filter(
      utxo =>
        utxo.asset.assetId === getAvaxAssetId(!!network.isTestnet) &&
        ((tx.txType === 'ImportTx' &&
          utxo.consumedOnChainId === pBlockchainId) ||
          (tx.txType === 'ExportTx' &&
            utxo.consumedOnChainId !== pBlockchainId))
    )
    .reduce((agg, utxo) => agg.add(utxo.amount), new Big(0))

  const amount = getAmount({
    isBaseTx,
    baseTxValue,
    isImportExport,
    importExportAmount,
    tx,
    network
  })

  const fee = Avax.fromNanoAvax(
    tx.amountBurned
      ?.filter(value => value.assetId === getAvaxAssetId(!!network.isTestnet))
      ?.reduce(
        (accumulator, value) => accumulator.add(value.amount),
        new Big(0)
      ) ?? 0
  )

  const isSender = froms.has(stripChainAddress(address))

  return {
    amount: amount.toDisplay(),
    hash: tx.txHash,
    isBridge: false,
    isContractCall: false,
    isIncoming: !isSender,
    isOutgoing: isSender,
    from: [...froms.values()].join(','),
    to: [...tos.values()].join(','),
    isSender,
    timestamp: tx.blockTimestamp * 1000, // to millis
    token: {
      decimal: network.networkToken.decimals.toString(),
      name: network.networkToken.name,
      symbol: network.networkToken.symbol
    },
    fee: fee.toSubUnit().toString(),
    explorerLink: getExplorerAddressByNetwork(network, tx.txHash, 'tx'),
    txType: tx.txType
  }
}

function getAmount({
  isBaseTx,
  baseTxValue,
  isImportExport,
  importExportAmount,
  tx,
  network
}: {
  isBaseTx: boolean
  baseTxValue: Big
  isImportExport: boolean
  importExportAmount: Big
  tx: PChainTransaction
  network: Network
}): Avax {
  return isBaseTx
    ? Avax.fromNanoAvax(baseTxValue)
    : isImportExport
    ? Avax.fromNanoAvax(importExportAmount)
    : isEmpty(tx.amountStaked)
    ? Avax.fromNanoAvax(aggregateValue(tx.value, !!network.isTestnet) ?? 0)
    : Avax.fromNanoAvax(
        aggregateValue(tx.amountStaked, !!network.isTestnet) ?? 0
      )
}

function aggregateValue(
  value: PChainTransaction['value'],
  isTestnet: boolean
): Big | undefined {
  return value
    .filter(value_ => value_.assetId === getAvaxAssetId(isTestnet))
    .reduce((accumulator, value_) => accumulator.add(value_.amount), new Big(0))
}

function getAvaxAssetId(isTestnet: boolean): string {
  return isTestnet
    ? Avalanche.FujiContext.avaxAssetID
    : Avalanche.MainnetContext.avaxAssetID
}

export function getTransactionTypeTitle(
  txType: string | undefined
): string | undefined {
  switch (txType) {
    case PChainTransactionType.ADD_DELEGATOR_TX:
      return 'Add Delegator'
    case PChainTransactionType.ADD_SUBNET_VALIDATOR_TX:
      return 'Add Subnet Validator'
    case PChainTransactionType.ADD_PERMISSIONLESS_VALIDATOR_TX:
      return 'Add Permissionless Validator'
    case PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX:
      return 'Add Permissionless Delegator'
    case PChainTransactionType.ADD_VALIDATOR_TX:
      return 'Add Validator'
    case PChainTransactionType.ADVANCE_TIME_TX:
      return 'Advance Time'
    case PChainTransactionType.BASE_TX:
      return 'BaseTx'
    case PChainTransactionType.CREATE_CHAIN_TX:
      return 'Create Chain'
    case PChainTransactionType.CREATE_SUBNET_TX:
      return 'Create Subnet'
    case PChainTransactionType.EXPORT_TX:
      return 'Export'
    case PChainTransactionType.IMPORT_TX:
      return 'Import'
    case PChainTransactionType.REWARD_VALIDATOR_TX:
      return 'Reward Validator'
    case PChainTransactionType.REMOVE_SUBNET_VALIDATOR_TX:
      return 'Remove Subnet Validator'
    case PChainTransactionType.TRANSFER_SUBNET_OWNERSHIP_TX:
      return 'Transfer Subnet Ownership'
    case PChainTransactionType.TRANSFORM_SUBNET_TX:
      return 'Transform Subnet'
    default:
      return undefined
  }
}
