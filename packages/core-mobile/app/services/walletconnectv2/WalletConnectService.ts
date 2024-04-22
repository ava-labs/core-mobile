import { Core } from '@walletconnect/core'
import { EngineTypes, SessionTypes } from '@walletconnect/types'
import { IWeb3Wallet, Web3Wallet } from '@walletconnect/web3wallet'
import { getSdkError } from '@walletconnect/utils'
import Config from 'react-native-config'
import { RpcError } from 'store/rpc/types'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import { EVM_IDENTIFIER } from 'consts/walletConnect'
import promiseWithTimeout from 'utils/js/promiseWithTimeout'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isXPChain } from 'utils/network/isPvmNetwork'
import { CLIENT_METADATA, WalletConnectCallbacks } from './types'
import {
  addNamespaceToAddress,
  addNamespaceToChain,
  addressAlreadyInSession,
  chainAlreadyInSession
} from './utils'

const UPDATE_SESSION_TIMEOUT = 15000

const LOG_LEVEL = __DEV__ ? 'error' : 'silent'

if (!Config.WALLET_CONNECT_PROJECT_ID) {
  throw Error(
    'WALLET_CONNECT_PROJECT_ID is missing. Please check your env file.'
  )
}

class WalletConnectService {
  #client: IWeb3Wallet | undefined

  private get client(): IWeb3Wallet {
    assertNotUndefined(this.#client)
    return this.#client
  }

  private set client(client: IWeb3Wallet) {
    this.#client = client
  }

  init = async (callbacks: WalletConnectCallbacks): Promise<void> => {
    if (this.#client !== undefined) {
      Logger.info('WC already initialized')
      return
    }
    // after init, WC will auto restore sessions
    const core = new Core({
      logger: LOG_LEVEL,
      projectId: Config.WALLET_CONNECT_PROJECT_ID
    })

    this.client = await Web3Wallet.init({
      core,
      metadata: CLIENT_METADATA
    })

    this.client.on('session_proposal', requestEvent => {
      callbacks.onSessionProposal(requestEvent)
    })

    this.client.on('session_request', requestEvent => {
      const requestSession = this.getSession(requestEvent.topic)
      requestSession &&
        callbacks.onSessionRequest(requestEvent, requestSession.peer.metadata)
    })

    this.client.on('session_delete', requestEvent => {
      const requestSession = this.getSession(requestEvent.topic)
      requestSession && callbacks.onDisconnect(requestSession.peer.metadata)
    })
  }

  pair = async (uri: string): Promise<void> => {
    try {
      await this.client.pair({ uri, activatePairing: true })
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('pairing already exists')
      ) {
        Logger.info(
          'pairing already exists, wc will reuse it automatically to prompt a new session'
        )
        return
      }

      if (
        error instanceof Error &&
        error.message
          .toLowerCase()
          .includes('missing or invalid. pair() uri#relay-protocol')
      ) {
        Logger.info('ignore invalid link')
        return
      }

      // rethrow for all other errors
      throw error
    }
  }

  getSessions = (): SessionTypes.Struct[] => {
    return Object.values(this.client.getActiveSessions())
  }

  getSession = (topic: string): SessionTypes.Struct | undefined => {
    return this.client.getActiveSessions()?.[topic]
  }

  approveSession = async ({
    id,
    relayProtocol,
    namespaces
  }: Pick<
    EngineTypes.ApproveParams,
    'id' | 'relayProtocol' | 'namespaces'
  >): Promise<SessionTypes.Struct> => {
    return await this.client.approveSession({
      id,
      relayProtocol,
      namespaces
    })
  }

  rejectSession = async (id: number): Promise<void> => {
    await this.client.rejectSession({
      id,
      reason: getSdkError('USER_REJECTED_METHODS')
    })
  }

  approveRequest = async (
    topic: string,
    requestId: number,
    result: unknown
  ): Promise<void> => {
    const response = { id: requestId, result, jsonrpc: '2.0' }

    await this.client.respondSessionRequest({ topic, response })
  }

  rejectRequest = async (
    topic: string,
    requestId: number,
    error: RpcError
  ): Promise<void> => {
    const response = {
      id: requestId,
      jsonrpc: '2.0',
      error
    }

    await this.client.respondSessionRequest({ topic, response })
  }

  killSession = async (topic: string): Promise<void> => {
    await this.client.disconnectSession({
      topic,
      reason: getSdkError('USER_DISCONNECTED')
    })
  }

  killAllSessions = async (): Promise<void> => {
    const promises: Promise<void>[] = []

    this.getSessions().forEach(session => {
      promises.push(this.killSession(session.topic))
    })

    await Promise.allSettled(promises)
  }

  killSessions = (topics: string[]): void => {
    const promises: Promise<void>[] = []

    for (const topic of topics) {
      promises.push(this.killSession(topic))
    }

    Promise.allSettled(promises).catch(reason => Logger.error(reason))
  }

  updateSession = async ({
    session,
    chainId,
    address
  }: {
    session: SessionTypes.Struct
    chainId: number
    address: string
  }): Promise<void> => {
    if (isBitcoinChainId(chainId)) {
      Logger.info('skip updating WC session for bitcoin network')
      return
    }

    Logger.info(
      `updating WC session '${session.peer.metadata.name}' with chainId ${chainId} and address ${address}`
    )
    const topic = session.topic
    const formattedChain = addNamespaceToChain(chainId)
    const formattedAddress = addNamespaceToAddress(address, chainId)

    const namespaces = session.namespaces[EVM_IDENTIFIER]

    if (namespaces === undefined) return

    if (!chainAlreadyInSession(session, chainId)) {
      namespaces.chains?.push(formattedChain)
    }

    if (!addressAlreadyInSession(session, formattedAddress)) {
      namespaces.accounts.push(formattedAddress)
    }

    // check if dapp is online first
    await this.client.engine.signClient.ping({ topic })

    await this.client.updateSession({
      topic,
      namespaces: {
        [EVM_IDENTIFIER]: namespaces
      }
    })

    // emitting events
    await this.client.emitSessionEvent({
      topic,
      event: {
        name: 'chainChanged',
        data: chainId
      },
      chainId: formattedChain
    })

    await this.client.emitSessionEvent({
      topic,
      event: {
        name: 'accountsChanged',
        data: [formattedAddress]
      },
      chainId: formattedChain
    })
  }

  updateSessionWithTimeout = async ({
    session,
    chainId,
    address
  }: {
    session: SessionTypes.Struct
    chainId: number
    address: string
  }): Promise<void> => {
    // if dapp is not online, updateSession will be stuck for a long time
    // we are using promiseWithTimeout here to exit early when that happens
    return promiseWithTimeout(
      this.updateSession({ session, chainId, address }),
      UPDATE_SESSION_TIMEOUT
    ).catch(e => {
      Logger.warn(
        `unable to update WC session '${session.peer.metadata.name}'`,
        e
      )
    })
  }

  updateSessions = async ({
    chainId,
    address
  }: {
    chainId: number
    address: string
  }): Promise<void> => {
    if (isBitcoinChainId(chainId)) {
      Logger.info('skip updating WC sessions for bitcoin network')
      return
    }
    if (isXPChain(chainId)) {
      Logger.info('skip updating WC sessions for X/P network')
      return
    }

    const promises: Promise<void>[] = []

    this.getSessions().forEach(session => {
      const promise = this.updateSessionWithTimeout({
        session,
        chainId,
        address
      })
      promises.push(promise)
    })

    await Promise.allSettled(promises)
  }
}

export default new WalletConnectService()
