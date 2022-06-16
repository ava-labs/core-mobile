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
import Big from 'big.js'
import { TransferEventType } from 'contexts/BridgeContext'
import { useSelector } from 'react-redux'
import { selectNetworks } from 'store/network'
import walletService from 'services/wallet/WalletService'
import { selectActiveAccount } from 'store/account'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { ChainId } from '@avalabs/chains-sdk'
import networkService from 'services/network/NetworkService'

const events = new EventEmitter()

/**
 * prepares asset to be transfered by check creating a TransactionRequest, signing with wallet.signEvm;
 * @param asset
 */
export function useTransferAsset() {
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useActiveNetwork()
  const networks = useSelector(selectNetworks)
  const config = useBridgeConfig().config
  const { currentBlockchain } = useBridgeSDK()
  const address = activeAccount?.address ?? ''

  function getNetworkForBlockchain() {
    // We have to get the network for the current blockchain
    if (currentBlockchain === Blockchain.AVALANCHE) {
      return activeNetwork.isTestnet
        ? networks[ChainId.AVALANCHE_TESTNET_ID]
        : networks[ChainId.AVALANCHE_MAINNET_ID]
    } else if (currentBlockchain === Blockchain.BITCOIN) {
      return activeNetwork.isTestnet
        ? networks[ChainId.BITCOIN_TESTNET]
        : networks[ChainId.BITCOIN]``
    } else if (currentBlockchain === Blockchain.ETHEREUM) {
      return activeNetwork.isTestnet
        ? networks[ChainId.ETHEREUM_TEST_RINKEBY]
        : networks[ChainId.ETHEREUM_HOMESTEAD]
    }
  }

  async function transferHandler(
    blockChain: Blockchain,
    amount: Big,
    asset: EthereumConfigAsset | NativeAsset
  ) {
    const blockchainNetwork = getNetworkForBlockchain()

    if (!config || !blockchainNetwork) {
      return Promise.reject('Wallet not ready')
    }

    const avalancheProvider = networkService.getAvalancheProvider(
      activeNetwork.isTestnet,
      networks
    )
    const ethereumProvider = networkService.getEthereumProvider(
      activeNetwork.isTestnet
    )

    const handleStatusChange = (status: WrapStatus) => {
      events.emit(TransferEventType.WRAP_STATUS, status)
    }
    const handleTxHashChange = (txHash: string) => {
      events.emit(TransferEventType.TX_HASH, txHash)
    }

    const activeAccountIndex = activeAccount?.index ?? 0

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
      async txData => {
        return await walletService.sign(
          txData,
          activeAccountIndex,
          blockchainNetwork
        )
      }
    )
  }

  return {
    transferHandler,
    events
  }
}
