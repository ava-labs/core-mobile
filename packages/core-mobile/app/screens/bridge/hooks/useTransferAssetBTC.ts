import { useSelector } from 'react-redux'
import { useCallback } from 'react'
import { Blockchain, useBridgeSDK } from '@avalabs/core-bridge-sdk'
import { selectBridgeAppConfig } from 'store/bridge'
import { useInAppRequest } from 'hooks/useInAppRequest'
import BridgeService from 'services/bridge/BridgeService'
import { selectIsDeveloperMode } from 'store/settings/advanced/slice'
import { selectActiveAccount } from 'store/account/slice'

type TransferParams = {
  amount: number
  feeRate: number
}

/**
 * Hook for transferring assets from Bitcoin to Avalanche
 */
export function useTransferAssetBTC(): {
  transfer: ({ amount, feeRate }: TransferParams) => Promise<string | undefined>
} {
  const config = useSelector(selectBridgeAppConfig)
  const { currentBlockchain } = useBridgeSDK()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const activeAccount = useSelector(selectActiveAccount)
  const { request } = useInAppRequest()

  const transfer = useCallback(
    async ({ amount, feeRate }: TransferParams) => {
      if (currentBlockchain !== Blockchain.BITCOIN) {
        return Promise.reject('Invalid blockchain')
      }

      if (!config) {
        return Promise.reject('Wallet not ready')
      }

      if (!activeAccount) {
        return Promise.reject('No active account')
      }

      return BridgeService.transferBTC({
        fromAccount: activeAccount.addressBTC,
        amount,
        feeRate,
        config,
        isMainnet: !isDeveloperMode,
        request
      })
    },
    [currentBlockchain, config, activeAccount, isDeveloperMode, request]
  )

  return {
    transfer
  }
}
