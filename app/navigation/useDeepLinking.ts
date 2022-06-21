import { useEffect, useState } from 'react'
import { Alert, Linking } from 'react-native'
import {
  ACTIONS,
  DeepLink,
  DeepLinkOrigin,
  PREFIXES,
  PROTOCOLS
} from 'services/walletconnect/types'
import URL from 'url-parse'
import URLParse from 'url-parse'
import qs, { ParsedQs } from 'qs'
import { CORE_UNIVERSAL_LINK_HOST } from 'resources/Constants'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import walletConnectService from 'services/walletconnect/WalletConnectService'

export function useDeepLinking(unlocked: boolean) {
  const [pendingDeepLink, setPendingDeepLink] = useState<DeepLink>()
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  function expireDeepLink() {
    setPendingDeepLink(undefined)
  }

  /******************************************************************************
   * 1. Start listeners that will receive the deep link url
   *****************************************************************************/
  useEffect(() => {
    // triggered if app is running
    Linking.addEventListener('url', ({ url }) => {
      setPendingDeepLink({ url, origin: DeepLinkOrigin.ORIGIN_DEEPLINK })
    })
    async function checkInitialUrl() {
      // initial URL (when app comes from cold start)
      const url = await Linking.getInitialURL()
      if (url) {
        setPendingDeepLink({ url, origin: DeepLinkOrigin.ORIGIN_DEEPLINK })
      }
    }
    checkInitialUrl()
  }, [])

  /******************************************************************************
   * 2. Wait for the app to become unlocked before we handle it.
   *****************************************************************************/
  useEffect(() => {
    if (pendingDeepLink && unlocked) {
      parseUrl(pendingDeepLink?.url, pendingDeepLink?.origin)
    }
  }, [unlocked, pendingDeepLink])

  /******************************************************************************
   * 3. Parsing of the url string happens here.
   *****************************************************************************/
  function parseUrl(url: string, origin?: DeepLinkOrigin) {
    const urlObj = new URL(
      url
        .replace(
          `${PROTOCOLS.DAPP}/${PROTOCOLS.HTTPS}://`,
          `${PROTOCOLS.DAPP}/`
        )
        .replace(`${PROTOCOLS.DAPP}/${PROTOCOLS.HTTP}://`, `${PROTOCOLS.DAPP}/`)
    )

    let params: ParsedQs | null = null

    if (urlObj.query.length) {
      try {
        params = qs.parse(urlObj.query.substring(1))
      } catch (e) {
        console.error(e)
      }
    }

    if (urlObj && url && params) {
      navigateWithProtocol(urlObj, params, url, origin)
      // once we used the url, we can expire it
      expireDeepLink()
    }
  }

  /******************************************************************************
   * 4. Using protocol type to navigate. Additional navigation methods/protocol
   * handling can be added here as the app matures
   *****************************************************************************/
  function navigateWithProtocol(
    urlObj: URLParse<string>,
    params: ParsedQs,
    originalUrl: string,
    origin?: DeepLinkOrigin
  ) {
    const protocol = urlObj.protocol.replace(':', '')
    switch (protocol) {
      // handles general WalletConnect custom url protocol
      case PROTOCOLS.WC: {
        try {
          const wcCleanUrl = originalUrl.replace('wc://wc?uri=', '')
          if (!walletConnectService.isValidUri(wcCleanUrl)) {
            return
          }
          walletConnectService.newSession(
            wcCleanUrl,
            !!params?.autosign,
            origin,
            activeAccount,
            activeNetwork
          )
        } catch (e) {
          Alert.alert((e as Error)?.message)
        }
        break
      }
      // handles Universal Link (iOS) url protocol
      case PROTOCOLS.HTTP:
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
          } else if (PREFIXES[action]) {
            const url = urlObj.href.replace(
              `https://${CORE_UNIVERSAL_LINK_HOST}/${action}/`,
              PREFIXES[action]
            )
            // loops back to open the link with the right protocol
            parseUrl(url, origin)
          }
        }
        break
      // Handles Metamask url protocol - Not sure yet if we want to handle this
      case PROTOCOLS.METAMASK:
        if (originalUrl.startsWith('metamask://wc')) {
          const cleanUrlObj = new URL(urlObj.query.replace('?uri=', ''))
          const href = cleanUrlObj.href

          if (!walletConnectService.isValidUri(href)) {
            return
          }
          walletConnectService.newSession(
            href,
            !!params?.autosign,
            origin,
            activeAccount,
            activeNetwork
          )
        }
        break
      default:
        return
    }
  }
}
