import WalletConnectClient from '@walletconnect/client'
import {
  ISessionStatus,
  IWalletConnectOptions
} from '@walletconnect/legacy-types'
import { CLIENT_OPTIONS, PeerMeta } from 'services/walletconnect/types'
import Logger from 'utils/Logger'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { ethErrors } from 'eth-rpc-errors'
import { ApprovedAppMeta } from 'store/walletConnect'
import { RpcError } from 'store/walletConnectV2'

export type WalletConnectCallbacks = {
  onSessionRequest: (peerId: string, payload: JsonRpcRequest) => void
  onCallRequest: (
    peerId: string,
    peerMeta: PeerMeta,
    payload: JsonRpcRequest
  ) => void
  onDisconnect: (clientId: string, peerMeta: PeerMeta) => void
}

class WalletConnectService {
  clients: WalletConnectClient[] = []

  private onSessionRequest =
    (client: WalletConnectClient, callbacks: WalletConnectCallbacks) =>
    (error: Error | null, payload: JsonRpcRequest) => {
      if (error) {
        Logger.error('received dapp session request with error', error)
        return
      }

      Logger.info('received dapp session request with payload', payload)
      callbacks.onSessionRequest(client.peerId, payload)
    }

  private onCallRequest =
    (client: WalletConnectClient, callbacks: WalletConnectCallbacks) =>
    (error: Error | null, payload: JsonRpcRequest) => {
      if (error) {
        Logger.error('received dapp call request with error', error)
        return
      }

      Logger.info('received dapp call request with payload', payload)
      callbacks.onCallRequest(client.peerId, client.peerMeta, payload)
    }

  private onDisconnect =
    (client: WalletConnectClient, callbacks: WalletConnectCallbacks) =>
    (error: Error | null) => {
      if (error) {
        Logger.error(
          `wc session ${client.peerMeta?.name} disconnected with error`,
          error
        )
        return
      }

      Logger.info(`wc session ${client.peerMeta?.name} disconnected`)
      callbacks.onDisconnect(client.clientId, client.peerMeta)
    }

  startSession = (
    options: IWalletConnectOptions,
    callbacks: WalletConnectCallbacks
  ) => {
    Logger.info('starting a new wc session', options.uri)

    const connOptions = {
      ...options,
      ...CLIENT_OPTIONS
    }

    const client = new WalletConnectClient(connOptions)

    client.on('session_request', this.onSessionRequest(client, callbacks))
    client.on('call_request', this.onCallRequest(client, callbacks))
    client.on('disconnect', this.onDisconnect(client, callbacks))
    client.on('session_update', () => Logger.info('wc session updated'))

    this.clients.push(client)
  }

  approveSession = (peerId: string, approveData: ISessionStatus) => {
    const client = this.clients.find(item => item.peerId === peerId)

    if (client) {
      client.approveSession(approveData)

      return {
        ...client.session,
        uri: client.uri
      }
    }
  }

  rejectSession = (peerId: string) => {
    const client = this.clients.find(item => item.peerId === peerId)
    client?.rejectSession()
  }

  approveCall = (peerId: string, id: number, result: unknown) => {
    const client = this.clients.find(item => item.peerId === peerId)

    client?.approveRequest({
      id,
      result: result,
      jsonrpc: '2.0'
    })
  }

  rejectCall = (peerId: string, id: number, error: RpcError) => {
    const client = this.clients.find(item => item.peerId === peerId)

    client?.rejectRequest({
      id,
      error: error.message ? error : ethErrors.provider.userRejectedRequest()
    })
  }

  restoreSessions = (
    persistedSessions: ApprovedAppMeta[],
    callbacks: WalletConnectCallbacks
  ) => {
    Logger.info('restoring wc sessions for persisted sessions')

    persistedSessions.forEach(session => {
      const connOptions = {
        uri: session.uri,
        bridge: session.bridge,
        session
      }

      this.startSession(connOptions, callbacks)
    })
  }

  updateAllSessions(addressC: string, chainId: string) {
    Logger.info('updating all wc sessions')
    Logger.info(`addressC: ${addressC} - chainId: ${chainId}`)

    this.clients.forEach(client => {
      if (client.connected) {
        client.updateSession({
          chainId: parseInt(chainId),
          accounts: [addressC]
        })
      }
    })
  }

  killSession = (peerId: string) => {
    const client = this.clients.find(item => item.peerId === peerId)

    if (client) {
      Logger.info('killing wc session with peerId', peerId)
      this.clients = this.clients.filter(item => item.peerId !== client.peerId)
      return client.killSession()
    }
  }

  killAllSessions = async () => {
    Logger.info('killing all wc sessions')
    const promises: Promise<void>[] = []

    this.clients.forEach(client => {
      promises.push(client.killSession())
    })

    await Promise.allSettled(promises)

    this.clients = []
  }

  killSessions = (peerIds: string[]) => {
    const promises: Array<Promise<void> | undefined> = []

    for (const peerId of peerIds) {
      promises.push(this.killSession(peerId))
    }

    return Promise.allSettled(promises)
  }
}

export default new WalletConnectService()
