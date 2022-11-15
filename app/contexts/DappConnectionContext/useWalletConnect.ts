import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { useEffect } from 'react'
import {
  CallRequestData,
  PeerMeta,
  WalletConnectRequest
} from 'services/walletconnect/types'
import WalletConnectService from 'services/walletconnect/WalletConnectService'
import { Account } from 'store/account'

type Params = {
  activeAccount: Account | undefined
  activeNetwork: Network
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleSessionRequest: (sessionInfo: any) => void
  handleCallRequest: (data: CallRequestData) => void
  handleSessionDisconnected: (peerMeta: PeerMeta) => void
}

export const useWalletConnect = ({
  activeAccount,
  activeNetwork,
  handleSessionRequest,
  handleCallRequest,
  handleSessionDisconnected
}: Params) => {
  /******************************************************************************
   * Initialize Wallet Connect
   *****************************************************************************/
  useEffect(() => {
    if (!activeAccount || !activeNetwork) return

    WalletConnectService.init(activeAccount, activeNetwork)
  }, [activeAccount, activeNetwork])

  /******************************************************************************
   * Update dapp sessions if active address or chain id changes
   *****************************************************************************/
  useEffect(() => {
    if (
      activeAccount &&
      activeNetwork &&
      activeNetwork.vmName !== NetworkVMType.BITCOIN
    ) {
      WalletConnectService.updateSessions(
        activeAccount.address,
        activeNetwork.chainId.toString()
      )
    }
  }, [activeNetwork, activeAccount])

  /******************************************************************************
   * Start listeners
   *****************************************************************************/
  useEffect(() => {
    WalletConnectService.emitter.on(
      WalletConnectRequest.SESSION,
      handleSessionRequest
    )

    return () => {
      WalletConnectService.emitter.removeListener(
        WalletConnectRequest.SESSION,
        handleSessionRequest
      )
    }
  }, [handleSessionRequest])

  useEffect(() => {
    WalletConnectService.emitter.on(
      WalletConnectRequest.SESSION_DISCONNECTED,
      handleSessionDisconnected
    )
    return () => {
      WalletConnectService.emitter.removeListener(
        WalletConnectRequest.SESSION_DISCONNECTED,
        handleSessionDisconnected
      )
    }
  }, [handleSessionDisconnected])

  useEffect(() => {
    WalletConnectService.emitter.on(
      WalletConnectRequest.CALL,
      handleCallRequest
    )

    return () => {
      WalletConnectService.emitter.removeListener(
        WalletConnectRequest.CALL,
        handleCallRequest
      )
    }
  }, [handleCallRequest])
}
