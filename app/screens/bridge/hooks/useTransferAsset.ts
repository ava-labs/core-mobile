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
import { getAvalancheProvider } from 'screens/bridge/utils/getAvalancheProvider'
import { getEthereumProvider } from 'screens/bridge/utils/getEthereumProvider'
import Big from 'big.js'
import { TransferEventType } from 'contexts/BridgeContext'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import walletService from 'services/wallet/WalletService'
import { selectActiveAccount } from 'store/account'

const events = new EventEmitter()

/**
 * prepares asset to be transfered by check creating a TransactionRequest, signing with wallet.signEvm;
 * @param asset
 */
export function useTransferAsset() {
  const network = useSelector(selectActiveNetwork)
  const activeAccount = useSelector(selectActiveAccount)
  const config = useBridgeConfig().config
  const { currentBlockchain } = useBridgeSDK()
  const address = activeAccount?.address ?? ''

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
    return await transferAssetSDK(
      currentBlockchain,
      amount,
      address,
      asset,
      avalancheProvider,
      ethereumProvider,
      config,
      handleStatusChange,
      handleTxHashChange,
      txData => walletService.sign(txData, activeAccount?.index ?? 0, network)
    )
  }

  return {
    transferHandler,
    events
  }
}
