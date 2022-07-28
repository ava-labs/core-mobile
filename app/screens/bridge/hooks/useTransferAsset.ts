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
import { useCallback } from 'react'
import {
  useAvalancheProvider,
  useEthereumProvider
} from 'hooks/networkProviderHooks'

const events = new EventEmitter()

/**
 * prepares asset to be transferred by check creating a TransactionRequest, signing with wallet.signEvm;
 */
export function useTransferAsset() {
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useActiveNetwork()
  const allNetworks = useSelector(selectNetworks)
  const config = useBridgeConfig().config
  const { currentBlockchain } = useBridgeSDK()
  const avalancheProvider = useAvalancheProvider()
  const ethereumProvider = useEthereumProvider()

  const address = activeAccount?.address ?? ''

  const getNetworkForBlockchain = useCallback(() => {
    // We have to get the network for the current blockchain
    if (currentBlockchain === Blockchain.AVALANCHE) {
      return activeNetwork.isTestnet
        ? allNetworks[ChainId.AVALANCHE_TESTNET_ID]
        : allNetworks[ChainId.AVALANCHE_MAINNET_ID]
    } else if (currentBlockchain === Blockchain.BITCOIN) {
      return activeNetwork.isTestnet
        ? allNetworks[ChainId.BITCOIN_TESTNET]
        : allNetworks[ChainId.BITCOIN]
    } else if (currentBlockchain === Blockchain.ETHEREUM) {
      return activeNetwork.isTestnet
        ? allNetworks[ChainId.ETHEREUM_TEST_RINKEBY]
        : allNetworks[ChainId.ETHEREUM_HOMESTEAD]
    }
  }, [activeNetwork.isTestnet, allNetworks, currentBlockchain])

  const transferHandler = useCallback(
    async (
      blockChain: Blockchain,
      amount: Big,
      asset: EthereumConfigAsset | NativeAsset
    ) => {
      const blockchainNetwork = getNetworkForBlockchain()

      if (
        !config ||
        !blockchainNetwork ||
        !avalancheProvider ||
        !ethereumProvider
      ) {
        return Promise.reject('Wallet not ready')
      }

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
    },
    [
      activeAccount?.index,
      address,
      avalancheProvider,
      config,
      currentBlockchain,
      ethereumProvider,
      getNetworkForBlockchain
    ]
  )

  return {
    transferHandler,
    events
  }
}
