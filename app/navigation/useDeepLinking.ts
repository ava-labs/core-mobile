import { Alert } from 'react-native'
import {
  ACTIONS,
  DeepLinkOrigin,
  PROTOCOLS
} from 'services/walletconnect/types'
import URL from 'url-parse'
import URLParse from 'url-parse'
import qs, { ParsedQs } from 'qs'
import { CORE_UNIVERSAL_LINK_HOST } from 'resources/Constants'
import walletConnectService from 'services/walletconnect/WalletConnectService'
import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account'
import Logger from 'utils/Logger'

/******************************************************************************
 * 3. Parsing of the url string happens here.
 *****************************************************************************/
export function parseUrl(
  url: string,
  origin?: DeepLinkOrigin,
  activeAccount?: Account,
  activeNetwork?: Network
) {
  const urlObj = new URL(url)

  let params: ParsedQs | undefined

  if (urlObj.query.length) {
    try {
      params = qs.parse(urlObj.query.substring(1))
    } catch (e) {
      Logger.error('failed to parse url params', e)
    }
  }
  if (urlObj && url) {
    try {
      navigateWithProtocol(
        urlObj,
        url,
        params,
        origin,
        activeAccount,
        activeNetwork
      )
    } catch (e) {
      Logger.error('failed to process dapp link', e)
      Alert.alert((e as Error)?.message)
    }
  }
}

/******************************************************************************
 * 4. Using protocol type to navigate. Additional navigation methods/protocol
 * handling can be added here as the app matures
 *****************************************************************************/
export function navigateWithProtocol(
  urlObj: URLParse<string>,
  originalUrl: string,
  params?: ParsedQs,
  origin?: DeepLinkOrigin,
  activeAccount?: Account,
  activeNetwork?: Network
) {
  const protocol = urlObj.protocol.replace(':', '')
  switch (protocol) {
    // handles general WalletConnect custom url protocol
    case PROTOCOLS.WC:
      if (!walletConnectService.isValidUri(originalUrl)) {
        return
      }
      walletConnectService.newSession(
        originalUrl,
        !!params?.autosign,
        origin,
        activeAccount,
        activeNetwork
      )
      break
    // handles Universal Link (iOS) url protocol
    case PROTOCOLS.HTTP:
      Logger.error('http protocol is not not supported for dapps', originalUrl)
      break
    case PROTOCOLS.HTTPS:
      if (urlObj.hostname === CORE_UNIVERSAL_LINK_HOST) {
        const action = urlObj.pathname.split('/')[1]
        if (action === ACTIONS.WC && params?.uri) {
          walletConnectService.newSession(
            params.uri.toString(),
            false,
            origin,
            activeAccount,
            activeNetwork
          )
        } else if (action === ACTIONS.WC) {
          // This is called from WC just to open the app, and it's not supposed to do anything
          return
        }
      }
      break
    default:
      return
  }
}
