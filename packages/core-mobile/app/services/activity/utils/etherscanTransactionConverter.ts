import { CriticalConfig } from '@avalabs/bridge-sdk'
import { Network } from '@avalabs/chains-sdk'
import { Erc20Tx, NormalTx } from '@avalabs/etherscan-sdk'
import { balanceToDisplayValue } from '@avalabs/utils-sdk'
import BN from 'bn.js'
import { Transaction } from 'store/transaction'
import { getExplorerAddressByNetwork } from 'utils/ExplorerUtils'
import { isBridgeTransactionEVM } from 'screens/bridge/utils/bridgeUtils'

export function convertTransactionERC20({
  tx,
  network,
  address,
  criticalConfig,
  bridgeAddresses
}: {
  tx: Erc20Tx
  network: Network
  address: string
  criticalConfig: CriticalConfig | undefined
  bridgeAddresses: string[]
}): Transaction {
  const isSender = tx.from.toLowerCase() === address.toLowerCase()
  const timestamp = parseInt(tx.timeStamp) * 1000
  const decimals = parseInt(tx.tokenDecimal)
  const amountBN = new BN(tx.value)
  const amountDisplayValue = balanceToDisplayValue(amountBN, decimals)
  const fee = getFeeString(tx)

  return {
    isBridge: isBridgeTransactionEVM({
      tx,
      network,
      criticalConfig,
      bridgeAddresses
    }),
    isIncoming: !isSender,
    isOutgoing: isSender,
    isContractCall: false,
    timestamp: timestamp,
    hash: tx.hash,
    amount: amountDisplayValue,
    isSender: isSender,
    from: tx.from,
    to: tx.to,
    token: {
      decimal: tx.tokenDecimal,
      name: tx.tokenName,
      symbol: tx.tokenSymbol
    },
    explorerLink: getExplorerAddressByNetwork(network, tx.hash),
    fee
  }
}

export function convertTransactionNormal(
  tx: NormalTx,
  network: Network,
  address: string
): Transaction {
  const isSender = tx.from.toLowerCase() === address.toLowerCase()
  const timestamp = parseInt(tx.timeStamp) * 1000
  const amountBN = new BN(tx.value)
  const amountDisplayValue = balanceToDisplayValue(
    amountBN,
    network.networkToken.decimals
  )
  const fee = getFeeString(tx)

  return {
    isBridge: false,
    isIncoming: !isSender,
    isOutgoing: isSender,
    isContractCall: isContractCall(tx),
    timestamp: timestamp,
    hash: tx.hash,
    amount: amountDisplayValue,
    isSender: isSender,
    from: tx.from,
    to: tx.to,
    token: {
      decimal: network.networkToken.decimals
        ? network.networkToken.decimals.toString()
        : '18',
      name: network.networkToken.name,
      symbol: network.networkToken.symbol
    },
    explorerLink: getExplorerAddressByNetwork(network, tx.hash),
    fee
  }
}

function isContractCall(tx: NormalTx): boolean {
  return tx.input !== '0x'
}

function getFeeString(tx: NormalTx | Erc20Tx): string {
  return (Number(tx.gasUsed ?? '0') * Number(tx.gasPrice ?? '0')).toString()
}
