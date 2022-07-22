import {
  ACTIONS,
  DEEPLINKS,
  MessageType,
  PREFIXES,
  PROTOCOLS
} from 'navigation/messages/models'
import { firstValueFrom } from 'rxjs'
import { wallet$ } from '@avalabs/wallet-react-components'
import { Alert } from 'react-native'
import qs from 'qs'
import URL from 'url-parse'
import { CORE_UNIVERSAL_LINK_HOST } from 'resources/Constants'
import WalletConnect from 'WalletConnect'

class DeepLinkingManager {
  private pendingDeepLink: string | null

  constructor() {
    this.pendingDeepLink = null
  }

  setDeepLink = (url: string) => (this.pendingDeepLink = url)
  getPendingDeepLink = () => this.pendingDeepLink
  expireDeepLink = () => (this.pendingDeepLink = null)

  parse(deepLink: string, origin: DEEPLINKS) {
    const urlObj = new URL(
      deepLink
        .replace(
          `${PROTOCOLS.DAPP}/${PROTOCOLS.HTTPS}://`,
          `${PROTOCOLS.DAPP}/`
        )
        .replace(`${PROTOCOLS.DAPP}/${PROTOCOLS.HTTP}://`, `${PROTOCOLS.DAPP}/`)
    )
    let params
    let wcCleanUrl

    if (urlObj.query.length) {
      try {
        params = qs.parse(urlObj.query.substring(1))
      } catch (e) {
        if (e) Alert.alert('Error', e.toString())
      }
    }

    switch (urlObj.protocol.replace(':', '')) {
      case PROTOCOLS.HTTP:
      case PROTOCOLS.HTTPS:
        if (urlObj.hostname === CORE_UNIVERSAL_LINK_HOST) {
          // action is the first part of the pathname
          const action = urlObj.pathname.split('/')[1]

          if (action === ACTIONS.WC && params?.uri) {
            WalletConnect.newSession(
              params.uri.toString(),
              params.redirectUrl?.toString(),
              false,
              origin
            )
          } else if (action === ACTIONS.WC) {
            // This is called from WC just to open the app, and it's not supposed to do anything
            return
          } else if (PREFIXES[action]) {
            const url = urlObj.href.replace(
              `https://${CORE_UNIVERSAL_LINK_HOST}/${action}/`,
              PREFIXES[action]
            )
            // loops back to open the link with the right protocol
            this.parse(url, origin)
          } else {
            // If it's our universal link don't open it in the browser
            if (
              !action &&
              urlObj.href === `https://${CORE_UNIVERSAL_LINK_HOST}/`
            )
              return

            // Normal links (same as dapp)
            // this._handleBrowserUrl(urlObj.href, browserCallBack)
          }
        }
        break

      // walletconnect related deeplinks
      // address, transactions, etc
      case PROTOCOLS.WC:
        wcCleanUrl = deepLink.replace('wc://wc?uri=', '')
        if (!WalletConnect.isValidUri(wcCleanUrl)) return

        WalletConnect.newSession(wcCleanUrl, !!params?.autosign, origin)
        break
      case PROTOCOLS.METAMASK:
        if (deepLink.startsWith('metamask://wc')) {
          const cleanUrlObj = new URL(urlObj.query.replace('?uri=', ''))
          const href = cleanUrlObj.href

          if (!WalletConnect.isValidUri(href)) return

          WalletConnect.newSession(href, !!params?.autosign, origin)
        }
        break
      default:
        return false
    }

    return true
  }

  async signMessage(messageType: MessageType, data: any) {
    const wallet = await firstValueFrom(wallet$)
    if (!wallet || wallet.type === 'ledger') {
      throw new Error(
        wallet
          ? `this function not supported on ${wallet.type} wallet`
          : 'wallet undefined in sign tx'
      )
    }
    if (data) {
      switch (messageType) {
        case MessageType.ETH_SIGN:
        case MessageType.PERSONAL_SIGN:
          return await wallet.personalSign(data)
        case MessageType.SIGN_TYPED_DATA:
        case MessageType.SIGN_TYPED_DATA_V1:
          return await wallet.signTypedData_V1(data)
        case MessageType.SIGN_TYPED_DATA_V3:
          return await wallet.signTypedData_V3(data)
        case MessageType.SIGN_TYPED_DATA_V4:
          return await wallet.signTypedData_V4(data)
      }
      throw new Error('unknown method')
    } else {
      throw new Error('no message to sign')
    }
  }
}

let instance: DeepLinkingManager | null = null

const SharedDeepLinkManager = {
  init: () => {
    instance = new DeepLinkingManager()
  },
  parse: (url: string, args) => instance?.parse(url, args),
  setDeepLink: url => instance?.setDeepLink(url),
  getPendingDeepLink: () => instance?.getPendingDeepLink(),
  expireDeepLink: () => instance?.expireDeepLink()
}

export default SharedDeepLinkManager
