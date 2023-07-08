import { CORE_UNIVERSAL_LINK_HOSTS } from 'resources/Constants'
import { parseUri } from '@walletconnect/utils'
import { ACTIONS, PROTOCOLS } from './types'

/**
 * attempt to parse a WC link
 *
 * the following formats are supported:
 * - https://core.app/wc?uri=wc%3Ab08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec%402%3Frelay-protocol%3Dirn%26symKey%3Da33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb
 * - wc:b08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec@2?relay-protocol=irn&symKey=a33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb
 * - core://wc?uri=wc%3Ab08d4b7be6bd25662c5922faadf82ff94d525af4282e0bdc9a78ae2ed9e086ec%402%3Frelay-protocol%3Dirn%26symKey%3Da33be37bb809cfbfbc788a54649bfbf1baa8cdbfe2fe21657fb51ef1bc7ab1fb
 */
export const parseWalletConnetLink = (rawUrl: string) => {
  const url = new URL(rawUrl)
  const protocol = url.protocol.replace(':', '')

  switch (protocol) {
    case PROTOCOLS.WC: {
      const uri = url.href
      const { version } = parseUri(uri)

      return { version, uri }
    }
    case PROTOCOLS.HTTPS: {
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

      return undefined
    }
    case PROTOCOLS.CORE: {
      const action = url.host

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

      return undefined
    }
    default:
      return undefined
  }
}
