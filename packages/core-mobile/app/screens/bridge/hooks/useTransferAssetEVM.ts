import {
  Asset,
  Blockchain,
  useBridgeSDK,
  WrapStatus
} from '@avalabs/bridge-sdk'
import Big from 'big.js'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useCallback } from 'react'
import { selectBridgeAppConfig } from 'store/bridge'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useInAppRequest } from 'hooks/useInAppRequest'
import BridgeService from 'services/bridge/BridgeService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'

type TransferParams = {
  amount: Big
  asset: Asset
  onStatusChange: (status: WrapStatus) => void
  onTxHashChange: (txHash: string) => void
}

/**
 * Hook for transferring assets between Avalanche and Ethereum
 */
export function useTransferAssetEVM(): {
  transfer: ({
    amount,
    asset,
    onStatusChange,
    onTxHashChange
  }: TransferParams) => Promise<string | undefined>
} {
  const { networks } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const config = useSelector(selectBridgeAppConfig)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const { currentBlockchain } = useBridgeSDK()
  const { request } = useInAppRequest()

  const transfer = useCallback(
    async ({
      amount,
      asset,
      onStatusChange,
      onTxHashChange
    }: TransferParams) => {
      if (
        currentBlockchain !== Blockchain.ETHEREUM &&
        currentBlockchain !== Blockchain.AVALANCHE
      ) {
        return Promise.reject('Invalid blockchain')
      }

      if (!config || !activeAccount) {
        return Promise.reject('Wallet not ready')
      }

      return BridgeService.transferEVM({
        currentBlockchain,
        amount: amount.toString(),
        asset,
        config,
        activeAccount,
        allNetworks: networks,
        isTestnet: isDeveloperMode,
        onStatusChange,
        onTxHashChange,
        request
      })
    },
    [
      currentBlockchain,
      config,
      activeAccount,
      isDeveloperMode,
      networks,
      request
    ]
  )

  return {
    transfer
  }
}
