import { Blockchain } from '@avalabs/bridge-sdk'
import { BITCOIN_NETWORK, Network } from '@avalabs/chains-sdk'
import { BitcoinHistoryTx } from '@avalabs/wallets-sdk'
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

const bitcoinAmount = (amount: number, demonimation: number) => {
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

  return {
    isBridge: isBridgeTransactionBTC(item, bitcoinWalletAddresses),
    isIncoming: !item.isSender,
    isOutgoing: item.isSender,
    isContractCall: false,
    timestamp: new Date(item.receivedTime).getTime(),
    hash: item.hash,
    amount: bitcoinAmount(item.amount, denomination),
    isSender: item.isSender,
    from: item.isSender ? address : txAddress,
    to: item.isSender ? txAddress : address,
    token: {
      decimal: denomination.toString(),
      name: BITCOIN_NETWORK.networkToken.name,
      symbol: BITCOIN_NETWORK.networkToken.symbol
    },
    explorerLink: getExplorerAddress(
      Blockchain.BITCOIN,
      item.hash,
      network.chainId === BITCOIN_NETWORK.chainId
    ),
    fee: item.fee.toString()
  }
}
