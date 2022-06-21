import { EventEmitter } from 'events'
import WalletConnectClient from '@walletconnect/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { parseWalletConnectUri } from '@walletconnect/utils'
import { firstValueFrom } from 'rxjs'
import {
  activeAccount$,
  network$,
  wallet$
} from '@avalabs/wallet-react-components'
import { ISessionStatus } from '@walletconnect/types'

export const CLIENT_OPTIONS = {
  clientMeta: {
    // Required
    description: 'Core Mobile',
    url: 'https://www.avax.network',
    icons: [
      'https://assets.website-files.com/5fec984ac113c1d4eec8f1ef/62602f568fb4677b559827e5_core.jpg'
    ],
    name: 'Core',
    ssl: !__DEV__
  }
}
let initialized = false
let connectors: WalletConnect[] = []
const tempCallIds: string[] = []
const hub = new EventEmitter()
type SessionOptions = {
  session: {
    redirectUrl: string
    autoSign: boolean
    requestOriginatedFrom: string
  }
}

export const WALLETCONNECT_SESSIONS = `walletconnectSessions`

const persistSessions = async () => {
  const sessions = connectors
    .filter(
      connector =>
        connector &&
        connector.walletConnectClient &&
        connector &&
        connector.walletConnectClient.connected
    )
    .map(connector => ({
      ...connector.walletConnectClient?.session,
      autosign: connector.autoSign,
      redirectUrl: connector.redirectUrl,
      requestOriginatedFrom: connector.requestOriginatedFrom
    }))

  await AsyncStorage.setItem(WALLETCONNECT_SESSIONS, JSON.stringify(sessions))
}

const waitForInitialization = async () => {
  let i = 0
  while (!initialized) {
    await new Promise<void>(res => setTimeout(() => res(), 1000))
    if (i++ > 5) initialized = true
  }
}

class WalletConnect {
  redirectUrl?: string
  autoSign = false
  url = { current: null }
  title = { current: null }
  icon = { current: null }
  hostname = null
  requestOriginatedFrom?: string
  walletConnectClient: WalletConnectClient | null

  constructor(options: SessionOptions, existing = false) {
    // if (options.session.redirectUrl) {
    //   this.redirectUrl = options.session.redirectUrl
    // }
    //
    // if (options.session.autoSign) {
    //   this.autoSign = options.session.autoSign
    // }
    //
    // if (options.session.requestOriginatedFrom) {
    //   this.requestOriginatedFrom = options.session.requestOriginatedFrom
    // }

    const connOptions = { ...options, ...CLIENT_OPTIONS }

    //init wallet
    this.walletConnectClient = new WalletConnectClient({ ...connOptions })

    this.walletConnectClient.on('session_request', async (error, payload) => {
      if (error) {
        console.error(error)
      }

      console.log('SESSION_REQUEST', error, payload)

      try {
        const sessionData = {
          ...payload.params[0],
          autoSign: this.autoSign,
          redirectUrl: this.redirectUrl,
          requestOriginatedFrom: this.requestOriginatedFrom
        }

        await waitForInitialization()
        await this.sessionRequest(sessionData)
        this.startSession(sessionData, existing)

        console.log('WC:', sessionData)
      } catch (e) {
        console.log('error', e)
        this.walletConnectClient?.rejectSession()
      }
    })

    this.walletConnectClient.on('call_request', async (error, payload) => {
      if (tempCallIds.includes(payload.id)) return
      tempCallIds.push(payload.id)

      console.log('CALL_REQUEST', error, payload)
      if (error) {
        throw error
      }

      try {
        const signedResult = await this.callRequests(payload)
        console.log('signedResult', signedResult)
        this.walletConnectClient?.approveRequest({
          id: payload.id,
          result: signedResult
        })
      } catch (e) {
        console.log('error or canceled call', e)
        this.walletConnectClient?.rejectRequest({
          id: payload.id,
          error: {
            message: 'USER HAS REJECTED'
          }
        })
      }
    })

    this.walletConnectClient.on('transport_error', error => {
      if (error) {
        console.error(error)
      }
    })

    this.walletConnectClient.on('disconnect', error => {
      if (error) {
        throw error
      }
      this.killSession()
      // persistSessions()
    })

    this.walletConnectClient.on('session_update', (error, payload) => {
      console.log('WC: Session update', payload)
      if (error) {
        throw error
      }
    })

    if (existing) {
      this.startSession(options.session, existing)
    }
  }

  killSession = () => {
    this.walletConnectClient && this.walletConnectClient.killSession()
    this.walletConnectClient = null
  }

  sessionRequest = (peerInfo: any) =>
    new Promise((resolve, reject) => {
      hub.emit('walletconnectSessionRequest', peerInfo)

      hub.on('walletconnectSessionRequest::approved', peerId => {
        if (peerInfo.peerId === peerId) {
          resolve(true)
        }
      })
      hub.on('walletconnectSessionRequest::rejected', peerId => {
        if (peerInfo.peerId === peerId) {
          reject(new Error('walletconnectSessionRequest::rejected'))
        }
      })
    })

  callRequests = (payload: any) =>
    new Promise((resolve, reject) => {
      hub.emit('walletconnectCallRequest', payload)

      hub.on('walletconnectCallRequest::approved', args => {
        const { id, hash } = args
        if (payload.id === id) {
          resolve(hash)
        }
      })
      hub.on('walletconnectCallRequest::rejected', id => {
        if (payload.id === id) {
          reject(new Error('walletconnectCallRequest::rejected'))
        }
      })
    })

  startSession = async (sessionData: any, existing: boolean) => {
    const network = await firstValueFrom(network$)
    const chainId = parseInt(network?.chainId ?? '1')
    const selectedAddress =
      (await firstValueFrom(activeAccount$))?.wallet?.getAddressC() ?? ''
    const approveData: ISessionStatus = {
      chainId: chainId,
      accounts: [selectedAddress]
    }
    if (existing) {
      this.walletConnectClient?.updateSession(approveData)
    } else {
      await this.walletConnectClient?.approveSession(approveData)
      // persistSessions()
    }
  }
}

const instance = {
  async init() {
    const sessionData = await AsyncStorage.getItem(WALLETCONNECT_SESSIONS)
    if (sessionData) {
      const sessions = JSON.parse(sessionData)
      sessions.forEach((session: SessionOptions) => {
        connectors.push(new WalletConnect(session, true))
      })
    }
    initialized = true
  },
  newSession(
    uri: string,
    redirectUrl?: string,
    autoSign?: boolean,
    requestOriginatedFrom?: string
  ) {
    const alreadyConnected = this.isSessionConnected(uri)
    if (alreadyConnected) {
      const errorMsg =
        'This session is already connected. Close the current session before starting a new one.'
      throw new Error(errorMsg)
    }

    const data = {
      uri,
      session: {
        redirectUrl: '',
        autoSign: false,
        requestOriginatedFrom: ''
      }
    }
    if (redirectUrl) {
      data.session.redirectUrl = redirectUrl
    }
    if (autoSign) {
      data.session.autoSign = autoSign
    }
    if (requestOriginatedFrom) {
      data.session.requestOriginatedFrom = requestOriginatedFrom
    }

    connectors.push(new WalletConnect(data))
  },
  killSession: async (id: string) => {
    // 1) First kill the session
    const connectorToKill = connectors.find(
      connector =>
        connector &&
        connector.walletConnectClient &&
        connector.walletConnectClient.session.peerId === id
    )
    if (connectorToKill) {
      await connectorToKill.killSession()
    }
    // 2) Remove from the list of connectors
    connectors = connectors.filter(
      connector =>
        connector &&
        connector.walletConnectClient &&
        connector.walletConnectClient.connected &&
        connector.walletConnectClient.session.peerId !== id
    )
    // 3) Persist the list
    // await persistSessions()
  },
  hub,
  isSessionConnected(uri: string) {
    const wcUri = parseWalletConnectUri(uri)
    return connectors.some(({ walletConnectClient }) => {
      if (!walletConnectClient) {
        return false
      }
      const { handshakeTopic, key } = walletConnectClient.session
      return handshakeTopic === wcUri.handshakeTopic && key === wcUri.key
    })
  },
  isValidUri(uri: string) {
    const result = parseWalletConnectUri(uri)
    if (!result.handshakeTopic || !result.bridge || !result.key) {
      return false
    }
    return true
  }
}

export default instance
