import { Blockchain } from '@avalabs/core-bridge-sdk'
import { TokenType, TransactionType } from '@avalabs/vm-module-types'
import { BITCOIN_NETWORK, Network } from '@avalabs/chains-sdk'
import { BitcoinHistoryTx } from '@avalabs/core-wallets-sdk'
import { isBridgeTransactionBTC } from 'screens/bridge/utils/bridgeUtils'
import { Transaction } from 'store/transaction'
import { getExplorerAddress } from 'utils/ExplorerUtils'

type ConvertTransactionParams = {
  item: BitcoinHistoryTx
  network: Network
  address: string
  bitcoinWalletAddresses:
    | {
        avalanche: string
        btc: string
      }
    | undefined
}

const bitcoinAmount = (amount: number, demonimation: number): string => {
  if (amount < 0) {
    amount = amount * -1
  }
  return (amount / Math.pow(10, demonimation)).toString()
}

export const convertTransaction = ({
  item,
  network,
  address,
  bitcoinWalletAddresses
}: ConvertTransactionParams): Transaction => {
  const txAddress = item.addresses[0] ? item.addresses[0] : ''

  const denomination = BITCOIN_NETWORK.networkToken.decimals

  // if sent to self, the addresses array will be empty (from @avalabs/core-wallets-sdk's source code)
  const to = item.isSender
    ? item.addresses.length === 0
      ? address
      : txAddress
    : address

  return {
    isBridge: isBridgeTransactionBTC(item, bitcoinWalletAddresses),
    isIncoming: !item.isSender,
    isOutgoing: item.isSender,
    isContractCall: false,
    timestamp: new Date(item.receivedTime * 1000).getTime(),
    hash: item.hash,
    isSender: item.isSender,
    from: item.isSender ? address : txAddress,
    to,
    tokens: [
      {
        decimal: denomination.toString(),
        name: BITCOIN_NETWORK.networkToken.name,
        symbol: BITCOIN_NETWORK.networkToken.symbol,
        amount: bitcoinAmount(item.amount, denomination),
        type: TokenType.NATIVE
      }
    ],
    explorerLink: getExplorerAddress(
      Blockchain.BITCOIN,
      item.hash,
      network.chainId === BITCOIN_NETWORK.chainId
    ),
    chainId: network.chainId.toString(),
    gasUsed: item.fee.toString(),
    txType: item.isSender ? TransactionType.SEND : TransactionType.RECEIVE
  }
}
