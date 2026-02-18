import React, { useEffect, useMemo, useState } from 'react'
import { showAlert } from '@avalabs/k2-alpine'
import { useSelector } from 'react-redux'
import { selectActiveWalletId } from 'store/wallet/slice'
import Logger from 'utils/Logger'
import { RpcMethod } from '@avalabs/vm-module-types'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getEthereumNetwork } from 'services/network/utils/providerUtils'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { getLedgerAppName } from '../utils'
import { useLedgerWalletMap, useLedgerParams } from '../store'
import { LedgerReviewScreen } from './LedgerReviewScreen'

export const LedgerReviewTransactionScreen = (): JSX.Element | null => {
  const walletId = useSelector(selectActiveWalletId)
  const { getLedgerInfoByWalletId } = useLedgerWalletMap()
  const { reviewTransactionParams } = useLedgerParams()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [isConnected, setIsConnected] = useState(false)
  const [isAppOpened, setIsAppOpened] = useState(false)

  // Extract params from store
  const {
    rpcMethod,
    network: _network,
    onApprove,
    onReject
  } = reviewTransactionParams || {}

  const { networks } = useNetworks()

  // Compute Ethereum network separately to avoid triggering network re-computation
  const ethNetwork = useMemo(
    () => getEthereumNetwork(networks, isDeveloperMode),
    [networks, isDeveloperMode]
  )

  const network = useMemo(() => {
    if (
      (rpcMethod === RpcMethod.ETH_SIGN ||
        rpcMethod === RpcMethod.PERSONAL_SIGN) &&
      ethNetwork
    ) {
      return ethNetwork
    }
    return _network
  }, [_network, ethNetwork, rpcMethod])

  const deviceForWallet = useMemo(
    () => getLedgerInfoByWalletId(walletId)?.device,
    [getLedgerInfoByWalletId, walletId]
  )

  const appType = useMemo(() => getLedgerAppName(network), [network])

  // Handle connection established - require correct app open
  useEffect(() => {
    if (deviceForWallet && isConnected && isAppOpened) {
      const handleApproval = async (): Promise<void> => {
        try {
          await onApprove?.()
        } catch (error) {
          Logger.error('Error during Ledger transaction approval', error)
          showAlert({
            title: 'Transaction failed',
            description:
              'Something went wrong while communicating with your Ledger device. Please try again.',
            buttons: [{ text: 'OK', style: 'default' }]
          })
        }
      }
      handleApproval()
    }
  }, [deviceForWallet, isAppOpened, isConnected, onApprove])

  return (
    <LedgerReviewScreen
      appType={appType}
      isWaitingForConnection={true}
      deviceForWallet={deviceForWallet}
      isConnected={isConnected}
      isAppOpened={isAppOpened}
      setIsConnected={setIsConnected}
      setIsAppOpened={setIsAppOpened}
      onReject={onReject}
    />
  )
}
