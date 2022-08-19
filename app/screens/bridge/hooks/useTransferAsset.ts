import { EventEmitter } from 'events'
import {
  Asset,
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
import { useCallback } from 'react'
import {
  useAvalancheProvider,
  useEthereumProvider
} from 'hooks/networkProviderHooks'
import { blockchainToNetwork } from '../utils/bridgeUtils'

const events = new EventEmitter()

/**
 * prepares asset to be transferred by check creating a TransactionRequest, signing with wallet.signEvm;
 */
export function useTransferAsset() {
  const activeAccount = useSelector(selectActiveAccount)
  const allNetworks = useSelector(selectNetworks)
  const config = useBridgeConfig().config
  const { currentBlockchain, criticalConfig } = useBridgeSDK()
  const avalancheProvider = useAvalancheProvider()
  const ethereumProvider = useEthereumProvider()

  const address = activeAccount?.address ?? ''

  const transferHandler = useCallback(
    async (amount: Big, asset: Asset) => {
      const blockchainNetwork = blockchainToNetwork(
        currentBlockchain,
        allNetworks,
        criticalConfig
      )

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
        asset as EthereumConfigAsset | NativeAsset, // TODO fix in sdk (should be Asset)
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
      allNetworks,
      avalancheProvider,
      config,
      criticalConfig,
      currentBlockchain,
      ethereumProvider
    ]
  )

  return {
    transferHandler,
    events
  }
}
