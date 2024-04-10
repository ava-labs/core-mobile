import { EventEmitter } from 'events'
import {
  Asset,
  EthereumConfigAsset,
  NativeAsset,
  transferAsset as transferAssetSDK,
  useBridgeSDK,
  WrapStatus
} from '@avalabs/bridge-sdk'
import Big from 'big.js'
import { TransferEventType } from 'contexts/BridgeContext'
import { useSelector } from 'react-redux'
import walletService from 'services/wallet/WalletService'
import { selectActiveAccount } from 'store/account'
import { useCallback } from 'react'
import {
  useAvalancheProvider,
  useEthereumProvider
} from 'hooks/networkProviderHooks'
import { selectBridgeAppConfig, selectBridgeCriticalConfig } from 'store/bridge'
import { TransactionResponse } from 'ethers'
import { NetworkTokenUnit } from 'types'
import { omit } from 'lodash'
import { Eip1559Fees } from 'utils/Utils'
import { useNetworks } from 'hooks/useNetworks'
import { blockchainToNetwork } from '../utils/bridgeUtils'

const events = new EventEmitter()

/**
 * prepares asset to be transferred by check creating a TransactionRequest, signing with wallet.signEvm;
 */
export function useTransferAsset(): {
  transferHandler: (
    amount: Big,
    asset: Asset,
    eip1559Fees?: Eip1559Fees<NetworkTokenUnit>
  ) => Promise<TransactionResponse | undefined>
  events: EventEmitter
} {
  const { selectNetworks } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const allNetworks = selectNetworks()
  const config = useSelector(selectBridgeAppConfig)
  const criticalConfig = useSelector(selectBridgeCriticalConfig)
  const { currentBlockchain } = useBridgeSDK()
  const avalancheProvider = useAvalancheProvider()
  const ethereumProvider = useEthereumProvider()

  const address = activeAccount?.address ?? ''

  const transferHandler = useCallback(
    async (
      amount: Big,
      asset: Asset,
      eip1559Fees?: Eip1559Fees<NetworkTokenUnit>
    ) => {
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

      const handleStatusChange = (status: WrapStatus): void => {
        events.emit(TransferEventType.WRAP_STATUS, status)
      }
      const handleTxHashChange = (txHash: string): void => {
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
          const tx = {
            ...omit(txData, 'gasPrice'),
            maxFeePerGas: eip1559Fees?.maxFeePerGas?.toSubUnit(),
            maxPriorityFeePerGas: eip1559Fees?.maxPriorityFeePerGas?.toSubUnit()
          }
          return await walletService.sign(
            tx,
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
