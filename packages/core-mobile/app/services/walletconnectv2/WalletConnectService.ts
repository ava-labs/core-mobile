import { Core } from '@walletconnect/core'
import { EngineTypes, SessionTypes } from '@walletconnect/types'
import { IWeb3Wallet, Web3Wallet } from '@walletconnect/web3wallet'
import { getSdkError } from '@walletconnect/utils'
import Config from 'react-native-config'
import { RpcError } from '@avalabs/vm-module-types'
import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  BlockchainNamespace
} from '@avalabs/core-chains-sdk'
import { assertNotUndefined } from 'utils/assertions'
import Logger from 'utils/Logger'
import promiseWithTimeout from 'utils/js/promiseWithTimeout'
import { WalletConnectServiceNoop } from 'services/walletconnectv2/WalletConnectServiceNoop'
import { CorePrimaryAccount } from '@avalabs/types'
import {
  CLIENT_METADATA,
  WalletConnectCallbacks,
  WalletConnectServiceInterface
} from './types'
import {
  addNamespaceToChain,
  getAddressWithCaip2ChainId,
  updateAccountListInNamespace,
  updateChainListInNamespace
} from './utils'

const UPDATE_SESSION_TIMEOUT = 15000

const LOG_LEVEL = __DEV__ ? 'error' : 'silent'

if (!Config.WALLET_CONNECT_PROJECT_ID) {
  Logger.warn(
    'WALLET_CONNECT_PROJECT_ID is missing in env file. Wallet connect is disabled.'
  )
}

class WalletConnectService implements WalletConnectServiceInterface {
  constructor(private walletConnectProjectId: string) {}

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
      projectId: this.walletConnectProjectId
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
      error: {
        code: error.code,
        message: error.message
      }
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
    account
  }: {
    session: SessionTypes.Struct
    chainId: number
    account: CorePrimaryAccount
  }): Promise<void> => {
    const topic = session.topic
    const caip2ChainId = addNamespaceToChain(chainId)

    const blockchainNamespace = caip2ChainId.split(':')[0]

    if (!blockchainNamespace) {
      throw new Error('invalid chain data')
    }

    const addressWithCaip2ChainId = getAddressWithCaip2ChainId({
      account,
      blockchainNamespace,
      caip2ChainId
    })

    if (!addressWithCaip2ChainId) {
      throw new Error('invalid chain data')
    }

    Logger.info(
      `updating WC session '${session.peer.metadata.name}' with chainId '${caip2ChainId}' and account '${addressWithCaip2ChainId}'`
    )

    const namespaces: SessionTypes.Namespaces = {}

    for (const key of Object.keys(session.namespaces)) {
      const namespace = session.namespaces[key]

      if (!namespace) continue

      // for the matching namespace, we need to update both chain and account lists
      // for the rest, we just leave as is
      if (key === blockchainNamespace) {
        updateChainListInNamespace({ chains: namespace.chains, caip2ChainId })

        updateAccountListInNamespace({
          account: addressWithCaip2ChainId,
          accounts: namespace.accounts
        })
      }

      namespaces[key] = { ...namespace }
    }

    // check if dapp is online first
    await this.client.engine.signClient.ping({ topic })

    await this.client.updateSession({
      topic,
      namespaces
    })

    // emitting events
    // but only for evm chains since neither wagmi/universal provider can handle non-evm chain events
    if (blockchainNamespace !== BlockchainNamespace.EIP155) {
      Logger.info(
        'skipping emitting wallet connect events since it is for a non-evm chain'
      )
      return
    }

    await this.client.emitSessionEvent({
      topic,
      event: {
        name: 'chainChanged',
        data: chainId
      },
      chainId: caip2ChainId
    })

    await this.client.emitSessionEvent({
      topic,
      event: {
        name: 'accountsChanged',
        data: [addressWithCaip2ChainId]
      },
      chainId: caip2ChainId
    })
  }

  updateSessionWithTimeout = async ({
    session,
    chainId,
    account
  }: {
    session: SessionTypes.Struct
    chainId: number
    account: CorePrimaryAccount
  }): Promise<void> => {
    // if dapp is not online, updateSession will be stuck for a long time
    // we are using promiseWithTimeout here to exit early when that happens
    return promiseWithTimeout(
      this.updateSession({ session, chainId, account }),
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
    account
  }: {
    chainId: number
    account: CorePrimaryAccount
  }): Promise<void> => {
    const promises: Promise<void>[] = []

    this.getSessions().forEach(session => {
      const promise = this.updateSessionWithTimeout({
        session,
        chainId,
        account
      })
      promises.push(promise)
    })

    await Promise.allSettled(promises)
  }

  updateSessionForNonEvmAccount = async ({
    session,
    account,
    isTestnet = false
  }: {
    session: SessionTypes.Struct
    account: CorePrimaryAccount
    isTestnet?: boolean
  }): Promise<void> => {
    const topic = session.topic
    Logger.info(
      `updating WC session '${session.peer.metadata.name}' with non evm chains.`
    )

    const namespaces: SessionTypes.Namespaces = {}

    for (const key of Object.keys(session.namespaces)) {
      const namespace = session.namespaces[key]

      if (!namespace) continue

      // update chain and account lists for avax and bip122 namespaces
      // when we toggle between testnet and mainnet, or change active account
      if (key === BlockchainNamespace.AVAX) {
        const caip2ChainIds = isTestnet
          ? [
              AvalancheCaip2ChainId.C_TESTNET,
              AvalancheCaip2ChainId.P_TESTNET,
              AvalancheCaip2ChainId.X_TESTNET
            ]
          : [
              AvalancheCaip2ChainId.C,
              AvalancheCaip2ChainId.P,
              AvalancheCaip2ChainId.X
            ]

        this.updateNamespaceForNonEvmCaip2ChainId({
          account,
          namespace,
          caip2ChainIds,
          blockchainNamespace: BlockchainNamespace.AVAX
        })
      }

      if (key === BlockchainNamespace.BIP122) {
        const caip2ChainIds = isTestnet
          ? [BitcoinCaip2ChainId.TESTNET]
          : [BitcoinCaip2ChainId.MAINNET]

        this.updateNamespaceForNonEvmCaip2ChainId({
          account,
          namespace,
          caip2ChainIds,
          blockchainNamespace: BlockchainNamespace.BIP122
        })
      }
      namespaces[key] = { ...namespace }
    }

    // check if dapp is online first
    await this.client.engine.signClient.ping({ topic })

    await this.client.updateSession({
      topic,
      namespaces
    })
  }

  private updateNamespaceForNonEvmCaip2ChainId = ({
    account,
    namespace,
    caip2ChainIds,
    blockchainNamespace
  }: {
    account: CorePrimaryAccount
    namespace: SessionTypes.Namespace
    caip2ChainIds: string[]
    blockchainNamespace: BlockchainNamespace
  }): void => {
    caip2ChainIds.forEach(caip2ChainId => {
      updateChainListInNamespace({ chains: namespace.chains, caip2ChainId })
      const addressWithCaip2ChainId = getAddressWithCaip2ChainId({
        account,
        blockchainNamespace,
        caip2ChainId
      })
      addressWithCaip2ChainId &&
        updateAccountListInNamespace({
          account: addressWithCaip2ChainId,
          accounts: namespace.accounts
        })
    })
  }

  updateSessionWithTimeoutForNonEvm = async ({
    session,
    account,
    isTestnet
  }: {
    session: SessionTypes.Struct
    account: CorePrimaryAccount
    isTestnet?: boolean
  }): Promise<void> => {
    // if dapp is not online, updateSession will be stuck for a long time
    // we are using promiseWithTimeout here to exit early when that happens
    return promiseWithTimeout(
      this.updateSessionForNonEvmAccount({ session, account, isTestnet }),
      UPDATE_SESSION_TIMEOUT
    ).catch(e => {
      Logger.warn(
        `unable to update WC session '${session.peer.metadata.name}' for non evm chains`,
        e
      )
    })
  }
}

export default Config.WALLET_CONNECT_PROJECT_ID
  ? new WalletConnectService(Config.WALLET_CONNECT_PROJECT_ID)
  : new WalletConnectServiceNoop()
