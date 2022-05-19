import { EventEmitter } from 'events'
import {
  Blockchain,
  EthereumConfigAsset,
  NativeAsset,
  transferAsset as transferAssetSDK,
  useBridgeConfig,
  useBridgeSDK,
  WrapStatus
} from '@avalabs/bridge-sdk'
import {
  useWalletContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import { getAvalancheProvider } from 'screens/bridge/utils/getAvalancheProvider'
import { getEthereumProvider } from 'screens/bridge/utils/getEthereumProvider'
import { WalletType } from '@avalabs/avalanche-wallet-sdk'
import Common, { Chain } from '@ethereumjs/common'
import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Transaction, TxData } from '@ethereumjs/tx'
import { makeBNLike } from 'utils/Utils'
import { BufferLike } from 'ethereumjs-util'
import Big from 'big.js'
import { TransferEventType } from 'contexts/BridgeContext'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import { ChainId } from '@avalabs/chains-sdk'

const events = new EventEmitter()

/**
 * prepares asset to be transfered by check creating a TransactionRequest, signing with wallet.signEvm;
 * @param asset
 */
export function useTransferAsset() {
  // @ts-ignore addresses exist in walletContext
  const { addresses } = useWalletStateContext()
  const network = useSelector(selectActiveNetwork)
  const wallet = useWalletContext().wallet
  const config = useBridgeConfig().config
  const { currentBlockchain } = useBridgeSDK()

  const account = addresses.addrC

  async function transferHandler(
    blockChain: Blockchain,
    amount: Big,
    asset: EthereumConfigAsset | NativeAsset
  ) {
    if (!config || !network) {
      return Promise.reject('Wallet not ready')
    }

    // Use the wallet provider for the current blockchain so transactions can be signed
    const avalancheProvider = getAvalancheProvider(network)
    const ethereumProvider = getEthereumProvider(network)

    const handleStatusChange = (status: WrapStatus) => {
      events.emit(TransferEventType.WRAP_STATUS, status)
    }
    const handleTxHashChange = (txHash: string) => {
      events.emit(TransferEventType.TX_HASH, txHash)
    }

    const isMainnet = network.chainId === ChainId.AVALANCHE_MAINNET_ID

    const common =
      currentBlockchain === Blockchain.AVALANCHE
        ? Common.custom({
            networkId: network.chainId,
            chainId: network.chainId
          })
        : new Common({
            chain: isMainnet ? Chain.Mainnet : Chain.Rinkeby
          })

    return await transferAssetSDK(
      currentBlockchain,
      amount,
      account,
      asset,
      avalancheProvider,
      ethereumProvider,
      config,
      handleStatusChange,
      handleTxHashChange,
      txData => signTransaction(wallet, common, txData)
    )
  }

  return {
    transferHandler,
    events
  }
}

async function signTransaction(
  wallet: WalletType | undefined,
  common: Common,
  txData: TransactionRequest
): Promise<string> {
  if (!wallet) return ''

  const tx = Transaction.fromTxData(convertTxData(txData), {
    common: common as any /* fix "private property '_chainParams'" conflict */
  })
  const signedTx = await wallet.signEvm(tx)
  const txHex = '0x' + signedTx.serialize().toString('hex')
  return txHex
}

/**
 * Convert tx data from `TransactionRequest` (ethers) to `TxData` (@ethereumjs)
 */
function convertTxData(txData: TransactionRequest): TxData {
  return {
    to: txData.to,
    nonce: makeBNLike(txData.nonce),
    gasPrice: makeBNLike(txData.gasPrice),
    gasLimit: makeBNLike(txData.gasLimit),
    value: makeBNLike(txData.value),
    data: txData.data as BufferLike,
    type: txData.type
  }
}
