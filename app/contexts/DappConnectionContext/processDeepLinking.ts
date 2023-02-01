import { Alert } from 'react-native'
import URL from 'url-parse'
import URLParse from 'url-parse'
import qs, { ParsedQs } from 'qs'
import { CORE_UNIVERSAL_LINK_HOSTS } from 'resources/Constants'
import { isValidUri } from 'services/walletconnect/WalletConnectService'
import Logger from 'utils/Logger'
import { AnyAction, Dispatch } from '@reduxjs/toolkit'
import { newSession } from 'store/walletConnect'
import { ACTIONS, PROTOCOLS } from './types'

/******************************************************************************
 * Process deep link and start wallet connect session accordingly
 *****************************************************************************/
export const processDeeplink = (url: string, dispatch: Dispatch<AnyAction>) => {
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
      handleLink(urlObj, url, dispatch, params)
    } catch (e) {
      Logger.error('failed to process dapp link', e)
      Alert.alert((e as Error)?.message)
    }
  }
}

/******************************************************************************
 * Handle link by protocol type. Additional protocol
 * handling can be added here as the app matures
 *****************************************************************************/
const handleLink = (
  urlObj: URLParse<string>,
  originalUrl: string,
  dispatch: Dispatch<AnyAction>,
  params?: ParsedQs
) => {
  const protocol = urlObj.protocol.replace(':', '')
  switch (protocol) {
    // handles general WalletConnect custom url protocol
    case PROTOCOLS.WC:
      if (!isValidUri(originalUrl)) {
        return
      }
      dispatch(newSession(originalUrl))
      break
    // handles Universal Link (iOS) url protocol
    case PROTOCOLS.HTTP:
      Logger.error('http protocol is not not supported for dapps', originalUrl)
      break
    case PROTOCOLS.HTTPS:
      if (CORE_UNIVERSAL_LINK_HOSTS.includes(urlObj.hostname)) {
        const action = urlObj.pathname.split('/')[1]
        if (action === ACTIONS.WC && params?.uri) {
          const uri = params.uri.toString()

          if (!isValidUri(uri)) {
            return
          }

          dispatch(newSession(uri))
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
