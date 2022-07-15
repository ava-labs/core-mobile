import BN from 'bn.js'
import { BitcoinConfigAssets, EthereumConfigAssets } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'
import {
  TransactionDetailsDto,
  NativeTransactionDto,
  Erc20TransferDetailsDto
} from '@avalabs/glacier-sdk'
import { balanceToDisplayValue } from '@avalabs/utils-sdk'
import { isBridgeTransaction } from 'screens/bridge/utils/bridgeTransactionUtils'
import { Account } from 'store/account'
import { Transaction } from 'store/transaction'

type ConvertTransactionParams = {
  item: TransactionDetailsDto
  network: Network
  account: Account
  ethereumWrappedAssets: EthereumConfigAssets
  bitcoinAssets: BitcoinConfigAssets
}

type ConvertTransactionWithERC20Params = {
  nativeTransaction: NativeTransactionDto
  erc20Transfer: Erc20TransferDetailsDto
  network: Network
  account: Account
  ethereumWrappedAssets: EthereumConfigAssets
  bitcoinAssets: BitcoinConfigAssets
}

type ConvertNativeTransactionParams = {
  nativeTransaction: NativeTransactionDto
  network: Network
  account: Account
}

const getExplorerAddressByNetwork = (
  network: Network,
  hash: string,
  hashType: 'address' | 'tx' = 'tx'
) => `${network.explorerUrl}/${hashType}/${hash}`

const convertTransactionWithERC20 = ({
  nativeTransaction,
  erc20Transfer,
  network,
  account,
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

  const isSender = from.toLowerCase() === account.address.toLowerCase()

  const explorerLink = getExplorerAddressByNetwork(network, txHash)

  const amountDisplayValue = balanceToDisplayValue(new BN(value), tokenDecimals)

  const isBridge = isBridgeTransaction(
    erc20Transfer,
    ethereumWrappedAssets,
    bitcoinAssets
  )

  const token = {
    decimal: tokenDecimals.toString(),
    name: tokenName,
    symbol: tokenSymbol
  }

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
    gasPrice,
    gasUsed
  }
}

const convertNativeTransaction = ({
  nativeTransaction,
  network,
  account
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

  const isSender = from.toLowerCase() === account.address.toLowerCase()

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
    gasPrice,
    gasUsed
  }
}

export const convertTransaction = ({
  item,
  network,
  account,
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
      account,
      bitcoinAssets,
      ethereumWrappedAssets
    })
  }

  return convertNativeTransaction({ nativeTransaction, network, account })
}
