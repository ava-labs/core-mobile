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
import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  ETHEREUM_NETWORK,
  ETHEREUM_TEST_NETWORK_RINKEBY
} from '@avalabs/chains-sdk'
import networkService from 'services/network/NetworkService'
import { JsonRpcBatchInternal } from '@avalabs/wallets-sdk'

const events = new EventEmitter()

/**
 * prepares asset to be transferred by check creating a TransactionRequest, signing with wallet.signEvm;
 * @param asset
 */
export function useTransferAsset() {
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useActiveNetwork()
  const allNetworks = useSelector(selectNetworks)
  const config = useBridgeConfig().config
  const { currentBlockchain } = useBridgeSDK()
  const address = activeAccount?.address ?? ''

  function getNetworkForBlockchain() {
    // We have to get the network for the current blockchain
    if (currentBlockchain === Blockchain.AVALANCHE) {
      return activeNetwork.isTestnet
        ? allNetworks[ChainId.AVALANCHE_TESTNET_ID]
        : allNetworks[ChainId.AVALANCHE_MAINNET_ID]
    } else if (currentBlockchain === Blockchain.BITCOIN) {
      return activeNetwork.isTestnet ? BITCOIN_TEST_NETWORK : BITCOIN_NETWORK
    } else if (currentBlockchain === Blockchain.ETHEREUM) {
      return activeNetwork.isTestnet
        ? ETHEREUM_TEST_NETWORK_RINKEBY
        : ETHEREUM_NETWORK
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
    const avalancheNetwork = activeNetwork.isTestnet
      ? allNetworks[ChainId.AVALANCHE_TESTNET_ID]
      : allNetworks[ChainId.AVALANCHE_MAINNET_ID]
    const avalancheProvider = networkService.getProviderForNetwork(
      avalancheNetwork
    ) as JsonRpcBatchInternal
    const ethereumProvider = networkService.getEthereumProvider(
      activeNetwork.isTestnet ?? false
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
