import SignClient from '@walletconnect/sign-client'
import { EngineTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import Config from 'react-native-config'
import { RpcError } from 'store/walletConnectV2'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import { CLIENT_METADATA, WalletConnectCallbacks } from './types'

if (!Config.WALLET_CONNECT_PROJECT_ID) {
  throw Error(
    'WALLET_CONNECT_PROJECT_ID is missing. Please check your env file.'
  )
}

class WalletConnectService {
  private _signClient: SignClient | undefined

  private get signClient() {
    assertNotUndefined(this._signClient)
    return this._signClient
  }

  private set signClient(client: SignClient) {
    this._signClient = client
  }

  init = async (callbacks: WalletConnectCallbacks) => {
    // after init, WC will auto restore sessions
    this.signClient = await SignClient.init({
      projectId: Config.WALLET_CONNECT_PROJECT_ID,
      metadata: CLIENT_METADATA
    })

    this.signClient.on('session_proposal', requestEvent => {
      callbacks.onSessionProposal(requestEvent)
    })

    this.signClient.on('session_request', requestEvent => {
      const requestSession = this.getSession(requestEvent.topic)
      callbacks.onSessionRequest(requestEvent, requestSession)
    })

    this.signClient.on('session_delete', requestEvent => {
      const requestSession = this.getSession(requestEvent.topic)
      callbacks.onDisconnect(requestSession.peer.metadata)
    })

    this.signClient.on('session_event', requestEvent => {
      Logger.info('wc v2 session_event', requestEvent)
    })

    this.signClient.on('session_update', requestEvent =>
      Logger.info('wc v2 session_update', requestEvent)
    )
  }

  pair = (uri: string) => {
    return this.signClient.core.pairing.pair({ uri })
  }

  getSessions = () => {
    return this.signClient.session.values
  }

  getSession = (topic: string) => {
    return this.signClient.session.get(topic)
  }

  approveSession = async (params: EngineTypes.ApproveParams) => {
    const { acknowledged } = await this.signClient.approve(params)
    return acknowledged()
  }

  rejectSession = async (id: number) => {
    return this.signClient.reject({
      id,
      reason: getSdkError('USER_REJECTED')
    })
  }

  approveRequest = async (
    topic: string,
    requestId: number,
    result: unknown
  ) => {
    const response = {
      id: requestId,
      jsonrpc: '2.0',
      result
    }

    return this.signClient.respond({
      topic,
      response
    })
  }

  rejectRequest = async (topic: string, requestId: number, error: RpcError) => {
    const response = {
      id: requestId,
      jsonrpc: '2.0',
      error
    }

    return this.signClient.respond({
      topic,
      response
    })
  }

  killSession = async (topic: string) => {
    return this.signClient.disconnect({
      topic,
      reason: getSdkError('USER_DISCONNECTED')
    })
  }

  killAllSessions = async () => {
    const promises: Promise<void>[] = []

    this.signClient.session.values.forEach(session => {
      promises.push(this.killSession(session.topic))
    })

    await Promise.allSettled(promises)
  }

  killSessions = (topics: string[]) => {
    const promises: Promise<void>[] = []

    for (const topic of topics) {
      promises.push(this.killSession(topic))
    }

    return Promise.allSettled(promises)
  }
}

export default new WalletConnectService()
