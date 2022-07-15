import BN from 'bn.js'
import { BitcoinConfigAssets, EthereumConfigAssets } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'
import {
  TransactionDetailsDto,
  NativeTransactionDto,
  Erc20TransferDetailsDto
} from '@avalabs/glacier-sdk'
import { balanceToDisplayValue } from '@avalabs/utils-sdk'
import { isBridgeTransactionEVM } from 'screens/bridge/utils/bridgeTransactionUtils'
import { Transaction } from 'store/transaction'
import { getExplorerAddressByNetwork } from 'utils/ExplorerUtils'

type ConvertTransactionParams = {
  item: TransactionDetailsDto
  network: Network
  address: string
  ethereumWrappedAssets: EthereumConfigAssets | undefined
  bitcoinAssets: BitcoinConfigAssets | undefined
}

type ConvertTransactionWithERC20Params = {
  nativeTransaction: NativeTransactionDto
  erc20Transfer: Erc20TransferDetailsDto
  network: Network
  address: string
  ethereumWrappedAssets: EthereumConfigAssets | undefined
  bitcoinAssets: BitcoinConfigAssets | undefined
}

type ConvertNativeTransactionParams = {
  nativeTransaction: NativeTransactionDto
  network: Network
  address: string
}

const convertTransactionWithERC20 = ({
  nativeTransaction,
  erc20Transfer,
  network,
  address,
  ethereumWrappedAssets,
  bitcoinAssets
}: ConvertTransactionWithERC20Params) => {
  const { txHash, blockTimestamp, gasPrice, gasUsed } = nativeTransaction
  const {
    erc20Token: { tokenDecimals, tokenName, tokenSymbol },
    from: { address: from },
    to: { address: to },
    value
  } = erc20Transfer

  const isSender = from.toLowerCase() === address.toLowerCase()

  const explorerLink = getExplorerAddressByNetwork(network, txHash)

  const amountDisplayValue = balanceToDisplayValue(new BN(value), tokenDecimals)

  const isBridge = isBridgeTransactionEVM(
    erc20Transfer,
    ethereumWrappedAssets,
    bitcoinAssets
  )

  const token = {
    decimal: tokenDecimals.toString(),
    name: tokenName,
    symbol: tokenSymbol
  }

  const fee = (Number(gasUsed ?? '0') * Number(gasPrice ?? '0')).toString()

  return {
    isBridge: isBridge,
    isContractCall: false,
    isIncoming: !isSender,
    isOutgoing: isSender,
    isSender: isSender,
    amount: amountDisplayValue,
    from,
    to,
    token,
    timestamp: blockTimestamp * 1000,
    hash: txHash,
    explorerLink,
    fee
  }
}

const convertNativeTransaction = ({
  nativeTransaction,
  network,
  address
}: ConvertNativeTransactionParams) => {
  const { networkToken } = network
  const {
    txHash,
    blockTimestamp,
    from: { address: from },
    to: { address: to },
    value,
    gasPrice,
    gasUsed
  } = nativeTransaction

  const isSender = from.toLowerCase() === address.toLowerCase()

  const isContractCall = Boolean(nativeTransaction.method?.methodHash)

  const explorerLink = getExplorerAddressByNetwork(network, txHash)

  const amountDisplayValue = balanceToDisplayValue(
    new BN(value),
    network.networkToken.decimals
  )

  const token = {
    decimal: networkToken.decimals ? networkToken.decimals.toString() : '18',
    name: networkToken.name,
    symbol: networkToken.symbol
  }

  const fee = (Number(gasUsed ?? '0') * Number(gasPrice ?? '0')).toString()

  return {
    isBridge: false,
    isContractCall: isContractCall,
    isIncoming: !isSender,
    isOutgoing: isSender,
    isSender: isSender,
    amount: amountDisplayValue,
    from,
    to,
    token,
    timestamp: blockTimestamp * 1000,
    hash: txHash,
    explorerLink,
    fee
  }
}

export const convertTransaction = ({
  item,
  network,
  address,
  ethereumWrappedAssets,
  bitcoinAssets
}: ConvertTransactionParams): Transaction => {
  const { nativeTransaction, erc20Transfers } = item

  const erc20Transfer = erc20Transfers?.[0]

  if (erc20Transfer) {
    return convertTransactionWithERC20({
      nativeTransaction,
      erc20Transfer,
      network,
      address,
      bitcoinAssets,
      ethereumWrappedAssets
    })
  }

  return convertNativeTransaction({ nativeTransaction, network, address })
}
