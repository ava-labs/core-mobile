import { CORE_UNIVERSAL_LINK_HOSTS } from 'resources/Constants'
import Logger from 'utils/Logger'
import { parseUri } from '@walletconnect/utils'
import { ACTIONS, PROTOCOLS } from './types'

// if the link is https://core.app/wc?uri=[uri] (from deep linking) or just [uri] (from the qr code)
// we will parse it
export const parseWalletConnetLink = (rawUrl: string) => {
  const url = new URL(rawUrl)

  const protocol = url.protocol.replace(':', '')

  if (protocol === PROTOCOLS.WC) {
    const uri = url.href
    const { version } = parseUri(uri)

    return { version, uri }
  } else if (protocol === PROTOCOLS.HTTPS) {
    if (CORE_UNIVERSAL_LINK_HOSTS.includes(url.hostname)) {
      const action = url.pathname.split('/')[1]

      if (action === ACTIONS.WC) {
        const uri = url.searchParams.get('uri')

        if (uri) {
          const { version } = parseUri(uri)

          return {
            version,
            uri
          }
        }
      }
    }
  }

  Logger.info(`${rawUrl} is not a wallet connect link`)
}
