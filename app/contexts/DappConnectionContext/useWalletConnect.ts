import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { useEffect } from 'react'
import { PeerMeta, WalletConnectRequest } from 'services/walletconnect/types'
import WalletConnectService from 'services/walletconnect/WalletConnectService'
import { Account } from 'store/account'
import { usePosthogContext } from 'contexts/PosthogContext'
import { EthereumRpcError, EthereumProviderError } from 'eth-rpc-errors'
import { SessionRequestRpcRequest } from 'store/rpc/handlers/session_request'
import { TypedJsonRpcRequest } from 'store/rpc/handlers/types'

type Params = {
  activeAccount: Account | undefined
  activeNetwork: Network
  handleSessionRequest: (
    sessionInfo: SessionRequestRpcRequest['payload']
  ) => void
  handleCallRequest: (data: TypedJsonRpcRequest<string, unknown>) => void
  handleSessionDisconnected: (peerMeta: PeerMeta) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const approveCall = (id: number, result: any) =>
  WalletConnectService.emitter.emit(WalletConnectRequest.CALL_APPROVED, {
    id,
    result
  })

export const rejectCall = (
  id: number,
  error: EthereumRpcError<unknown> | EthereumProviderError<unknown>
) => {
  WalletConnectService.emitter.emit(WalletConnectRequest.CALL_REJECTED, {
    id,
    error
  })
}

export const approveSession = (peerId: string | undefined) =>
  peerId &&
  WalletConnectService.emitter.emit(
    WalletConnectRequest.SESSION_APPROVED,
    peerId
  )

export const rejectSession = (peerId: string | undefined) =>
  peerId &&
  WalletConnectService.emitter.emit(
    WalletConnectRequest.SESSION_REJECTED,
    peerId
  )

export const useWalletConnect = ({
  activeAccount,
  activeNetwork,
  handleSessionRequest,
  handleCallRequest,
  handleSessionDisconnected
}: Params) => {
  const { capture } = usePosthogContext()
  useEffect(() => {
    WalletConnectService.setPosthogCapture(capture)
  }, [capture])

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
